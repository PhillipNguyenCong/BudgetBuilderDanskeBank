import { DateSchema, type SalarySuggestion, type Transaction } from '@budget-builder/contracts';
import { reconcileTransactions } from '../live-budget/reconcile.js';
const normalise = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/** Only explicit salary credits are candidates; ordinary credits are not inferred as income. */
export function suggestSalary(input: {
  accountId: string;
  date: string;
  transactions: readonly Transaction[];
}): Pick<SalarySuggestion, 'suggestion' | 'explanation'> {
  DateSchema.parse(input.date);
  const cutoff = new Date(`${input.date}T00:00:00Z`);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  const from = cutoff.toISOString().slice(0, 10);
  const groups = new Map<string, Transaction[]>();
  for (const item of reconcileTransactions(input.transactions, input.accountId)) {
    const tx = item.transaction;
    const words = ` ${normalise(tx.text)} `;
    if (
      !item.selected ||
      item.conflictingSourceVersions ||
      tx.status !== 'BOOKED' ||
      tx.direction !== 'CREDIT' ||
      tx.amountOere === null ||
      !Number.isSafeInteger(tx.amountOere) ||
      tx.amountOere <= 0 ||
      !tx.date ||
      tx.date <= from ||
      tx.date > input.date ||
      tx.transferEvidence ||
      !/(?:^| )(?:salary|payroll|løn|loen|lønudbetaling|lønoverførsel|nettoløn)(?: |$)/u.test(
        words,
      ) ||
      /(?:^| )(?:refund|refusion|tilbagebetaling|reversal)(?: |$)/u.test(words)
    )
      continue;
    const source =
      normalise(tx.counterparty ?? '') || normalise(tx.text).replace(/\d+/g, '').trim();
    const group = groups.get(source) ?? [];
    group.push(tx);
    groups.set(source, group);
  }
  const ranked = [...groups.values()]
    .map((records) => ({
      records,
      months: new Set(records.map((tx) => tx.date!.slice(0, 7))).size,
      total: records.reduce((sum, tx) => sum + BigInt(tx.amountOere!), 0n),
    }))
    .sort((a, b) => b.months - a.months || (a.total > b.total ? -1 : a.total < b.total ? 1 : 0));
  const first = ranked[0];
  if (!first)
    return {
      suggestion: null,
      explanation: 'No eligible booked salary found. Enter your monthly take-home income.',
    };
  if (ranked[1]?.months === first.months && ranked[1].total === first.total)
    return {
      suggestion: null,
      explanation:
        'Several salary sources are equally likely. Enter your monthly take-home income.',
    };
  const latest = [...first.records].sort(
    (a, b) => b.date!.localeCompare(a.date!) || a.id.localeCompare(b.id),
  )[0]!;
  // Same-day conflicting amounts have no reliable latest payment order.
  if (first.records.some((tx) => tx.date === latest.date && tx.amountOere !== latest.amountOere))
    return {
      suggestion: null,
      explanation: 'The latest salary amount is ambiguous. Enter your monthly take-home income.',
    };
  return {
    suggestion: {
      amountOere: latest.amountOere!,
      paymentDate: latest.date!,
      transactionId: latest.id,
    },
    explanation:
      'Latest booked payment from the main explicit salary source in the last twelve months. Edit the total to include other monthly income.',
  };
}
