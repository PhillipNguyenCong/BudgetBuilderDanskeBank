import { createHash } from 'node:crypto';
import type {
  BillFrequency,
  BillSuggestion,
  BudgetPlan,
  PlannedPayment,
  Transaction,
} from '@budget-builder/contracts';
import { billIdentityKeys, billMerchantKeys, knownMerchant } from './matching.js';
export { billMerchantKeys, billMatchScore } from './matching.js';
type Movement = Pick<Transaction, 'text' | 'counterparty'>;
const frequencies: Record<number, BillFrequency> = {
  1: 'MONTHLY',
  3: 'QUARTERLY',
  6: 'HALF_YEARLY',
  12: 'YEARLY',
};
function frequency(records: Transaction[]): BillFrequency | null {
  if (records.length < 2) return null;
  let interval: number | undefined;
  for (let index = 1; index < records.length; index++) {
    const before = records[index - 1]!.date!;
    const after = records[index]!.date!;
    const months =
      (Number(after.slice(0, 4)) - Number(before.slice(0, 4))) * 12 +
      Number(after.slice(5, 7)) -
      Number(before.slice(5, 7));
    const days = (Date.parse(`${after}T00:00:00Z`) - Date.parse(`${before}T00:00:00Z`)) / 86400000;
    if (
      !frequencies[months] ||
      (interval !== undefined && interval !== months) ||
      Math.abs(days - months * 30.4375) > 8
    )
      return null;
    interval = months;
  }
  return frequencies[interval!] ?? null;
}
export function discoverBills(input: {
  accountId: string;
  transactions: readonly Transaction[];
  payments: readonly PlannedPayment[];
  date: string;
  coverage: { from: string | null; to: string | null; completeMonths: number };
}) {
  const groups = new Map<
    string,
    {
      transactions: Transaction[];
      pending: Transaction[];
      payments: PlannedPayment[];
      keys: Set<string>;
    }
  >();
  const notes: string[] = [];
  let unusable = 0;
  function group(record: Movement) {
    const keys = billMerchantKeys(record);
    const primary = billIdentityKeys({ merchantKeys: keys })[0];
    if (!primary) return null;
    let value = groups.get(primary);
    if (!value) {
      value = { transactions: [], pending: [], payments: [], keys: new Set() };
      groups.set(primary, value);
    }
    keys.forEach((key) => value!.keys.add(key));
    return value;
  }
  for (const tx of new Map(input.transactions.map((t) => [t.id, t])).values()) {
    if (tx.accountId !== input.accountId || tx.direction === 'CREDIT' || tx.transferEvidence)
      continue;
    if (
      tx.direction !== 'DEBIT' ||
      (tx.status !== 'BOOKED' && tx.status !== 'PENDING') ||
      tx.amountOere === null ||
      !Number.isSafeInteger(tx.amountOere) ||
      tx.amountOere < 0 ||
      !tx.date ||
      tx.date > input.date ||
      (input.coverage.from && tx.date < input.coverage.from) ||
      (input.coverage.to && tx.date > input.coverage.to) ||
      tx.issues.some((issue) => issue.code === 'SOURCE_ID_COLLISION')
    ) {
      unusable++;
      continue;
    }
    const target = group(tx);
    if (tx.status === 'PENDING') target?.pending.push(tx);
    else target?.transactions.push(tx);
  }
  for (const payment of new Map(input.payments.map((p) => [p.id, p])).values()) {
    if (
      payment.accountId !== input.accountId ||
      payment.status !== 'SCHEDULED' ||
      payment.direction !== 'DEBIT' ||
      payment.recurring !== true ||
      payment.issues.some((issue) => issue.code === 'SOURCE_ID_COLLISION')
    )
      continue;
    group(payment)?.payments.push(payment);
  }
  const anonymousRent = groups.get('known:rent');
  const namedRentGroups = [...groups.entries()].filter(
    ([key, value]) => key.startsWith('payee:') && value.keys.has('known:rent'),
  );
  if (anonymousRent && namedRentGroups.length === 1) {
    const [, namedRent] = namedRentGroups[0]!;
    namedRent.transactions.push(...anonymousRent.transactions);
    namedRent.pending.push(...anonymousRent.pending);
    namedRent.payments.push(...anonymousRent.payments);
    anonymousRent.keys.forEach((key) => namedRent.keys.add(key));
    groups.delete('known:rent');
  }
  const suggestions: BillSuggestion[] = [];
  for (const [key, group] of groups) {
    const txs = group.transactions.sort(
      (a, b) => a.date!.localeCompare(b.date!) || a.id.localeCompare(b.id),
    );
    const pending = group.pending.sort(
      (a, b) => a.date!.localeCompare(b.date!) || a.id.localeCompare(b.id),
    );
    const evidence = [...txs, ...pending].sort(
      (a, b) => a.date!.localeCompare(b.date!) || a.id.localeCompare(b.id),
    );
    const cadence = frequency(evidence);
    const known = [...group.keys].some((key) => key.startsWith('known:'));
    const latest = evidence.at(-1);
    const payment = group.payments.sort((a, b) =>
      (a.expectedDate ?? '9999').localeCompare(b.expectedDate ?? '9999'),
    )[0];
    if (!cadence && !payment && !known) continue;
    const amounts = evidence.map((tx) => BigInt(tx.amountOere!));
    const low = amounts.reduce((a, b) => (a < b ? a : b), amounts[0] ?? 0n);
    const high = amounts.reduce((a, b) => (a > b ? a : b), 0n);
    const consistent = (high - low) * 100n <= (high * 5n > 10000n ? high * 5n : 10000n);
    const bookedCadence = frequency(txs);
    const recurring = !!bookedCadence && consistent && (known || txs.length >= 3);
    const record = latest ?? payment!;
    const label =
      knownMerchant(`${record.text} ${record.counterparty ?? ''}`) ??
      ((record.counterparty || record.text).trim().slice(0, 100) || 'Possible bill');
    const ids = [
      ...txs.map((tx) => tx.id),
      ...pending.map((tx) => tx.id),
      ...group.payments.map((payment) => payment.id),
    ].slice(0, 100);
    const explanation = `${txs.length} eligible booked payment${txs.length === 1 ? '' : 's'} and ${pending.length} pending payment${pending.length === 1 ? '' : 's'} found${cadence ? ` with ${cadence.toLowerCase().replace('_', ' ')} timing` : '; payment frequency is not established'}. ${latest ? `The latest ${latest.status === 'PENDING' ? 'pending' : 'booked'} payment amount is suggested.` : 'A recurring planned payment suggests this bill; it has not been paid.'} ${pending.length && !recurring ? 'Pending evidence cannot confirm that the bill has been paid or will recur.' : ''} ${!consistent ? 'Amounts varied; review the amount.' : ''} Review before creating your budget.`;
    suggestions.push({
      id: `bill-${createHash('sha256').update(`${input.accountId}:${key}`).digest('hex').slice(0, 24)}`,
      label,
      amountOere: record.amountOere,
      frequency: cadence,
      confidence: recurring ? 'RECURRING' : 'POSSIBLE',
      match: { merchantKeys: [...group.keys].slice(0, 20) },
      source: {
        kind: 'SUGGESTED',
        recordIds: ids,
        explanation,
        period:
          input.coverage.from && input.coverage.to
            ? { from: input.coverage.from, to: input.coverage.to }
            : null,
      },
    });
  }
  if (unusable)
    notes.push(
      `${unusable} uncertain or conflicting source records could not establish bill suggestions. They remain available in account activity.`,
    );
  if (input.coverage.completeMonths < 3)
    notes.push(
      `Only ${input.coverage.completeMonths} complete months of source history are available. Less certain bills need review.`,
    );
  return {
    suggestions: suggestions
      .sort((a, b) =>
        a.confidence === b.confidence
          ? a.label.localeCompare(b.label)
          : a.confidence === 'RECURRING'
            ? -1
            : 1,
      )
      .slice(0, 100),
    notes,
  };
}
export type SavedBillRow = Extract<
  BudgetPlan['pots'][number],
  { type: 'FIXED_EXPENSE' }
>['rows'][number];
