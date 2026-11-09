import { createHash } from 'node:crypto';
import {
  AccountSchema,
  DateSchema,
  TimestampSchema,
  TransactionSchema,
  PlannedPaymentSchema,
  QualitySchema,
} from '@budget-builder/contracts';
import type { Account, Transaction, PlannedPayment, DataIssue } from '@budget-builder/contracts';
import type { z } from 'zod';
type RecordValue = Record<string, unknown>;
const obj = (x: unknown): RecordValue =>
  x !== null && typeof x === 'object' && !Array.isArray(x) ? (x as RecordValue) : {};
const text = (x: unknown): string | null =>
  typeof x === 'string' && x.trim()
    ? x.trim()
    : typeof x === 'number' && Number.isFinite(x)
      ? String(x)
      : null;
const issue = (
  code: string,
  field: string | null,
  message: string,
  severity: DataIssue['severity'] = 'WARNING',
): DataIssue => ({ code, field, message, severity });
function canonical(x: unknown): string {
  if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
  if (x !== null && typeof x === 'object')
    return (
      '{' +
      Object.keys(x)
        .sort()
        .map((k) => JSON.stringify(k) + ':' + canonical((x as RecordValue)[k]))
        .join(',') +
      '}'
    );
  return JSON.stringify(x) ?? 'null';
}
const hash = (x: string) => createHash('sha256').update(x).digest('hex');
// Source values are major currency units. Source `decimals` is display metadata.
function decimal(x: unknown): string | null {
  let s = text(x);
  if (!s) return null;
  s = s.replace(/ /g, ' ').trim();
  if (s.includes(',') && s.includes('.')) {
    if (/^[+-]?\d{1,3}(\.\d{3})+,\d+$/.test(s)) s = s.replaceAll('.', '').replace(',', '.');
    else if (/^[+-]?\d{1,3}(,\d{3})+\.\d+$/.test(s)) s = s.replaceAll(',', '');
    else return null;
  } else if (s.includes(',')) s = s.replace(',', '.');
  return /^[+-]?\d+(?:\.\d+)?$/.test(s) ? s : null;
}
function scaled(s: string, digits: number): bigint | null {
  const m = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) return null;
  const fraction = m[3] ?? '';
  if (fraction.length > digits) return null;
  return (
    (m[1] === '-' ? -1n : 1n) *
    (BigInt(m[2]!) * 10n ** BigInt(digits) + BigInt(fraction.padEnd(digits, '0') || '0'))
  );
}
export function parseMoney(value: unknown): number | null {
  const s = decimal(value);
  if (!s) return null;
  const n = scaled(s, 2);
  return n !== null && n <= BigInt(Number.MAX_SAFE_INTEGER) && n >= BigInt(-Number.MAX_SAFE_INTEGER)
    ? Number(n)
    : null;
}
const currency = (x: unknown): string | null => {
  const s = text(x)?.toUpperCase();
  return s && /^[A-Z]{3}$/.test(s) ? s : null;
};
function date(x: unknown): string | null {
  const s = text(x);
  if (!s) return null;
  if (DateSchema.safeParse(s).success) return s;
  let m = /^(\d{4})(\d{2})(\d{2})$/.exec(s) ?? /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(s);
  if (m) {
    const d = `${m[1]}-${m[2]}-${m[3]}`;
    return DateSchema.safeParse(d).success ? d : null;
  }
  m = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(s);
  if (m) {
    const d = `${m[3]}-${m[2]}-${m[1]}`;
    return DateSchema.safeParse(d).success ? d : null;
  }
  if (TimestampSchema.safeParse(s).success)
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Copenhagen',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(s));
  return null;
}
function direction(value: unknown, issues: DataIssue[]): Transaction['direction'] {
  const d = text(value)?.toUpperCase();
  if (d === 'CREDIT' || d === 'DEBIT') return d;
  issues.push(
    issue(
      'UNKNOWN_DIRECTION',
      'direction',
      'Direction is unknown; a sign alone is not sufficient.',
    ),
  );
  return 'UNKNOWN';
}
function amount(
  raw: RecordValue,
  issues: DataIssue[],
  payment = false,
): Pick<Transaction, 'amountOere' | 'original' | 'conversionBasis'> {
  const a = obj(raw.amount),
    value = payment ? raw.amount : Object.keys(a).length ? a.value : raw.amount;
  const c = currency(payment ? raw.amountCurrency : (a.currency ?? a.ccy));
  const originalSource = obj(raw.originalAmount);
  const original = Object.keys(originalSource).length
    ? {
        amount: decimal(originalSource.value),
        currency: currency(originalSource.currency ?? originalSource.ccy),
      }
    : { amount: decimal(value), currency: c };
  const ac = obj(raw.amountInAccountCurrency),
    accountValue = parseMoney(ac.value),
    accountCurrency = currency(ac.currency ?? ac.ccy);
  let n: number | null = null,
    basis: Transaction['conversionBasis'] = 'UNAVAILABLE';
  if (accountValue !== null && accountCurrency === 'DKK') {
    n = accountValue;
    basis = 'ACCOUNT_AMOUNT';
  } else if (c === 'DKK') {
    n = parseMoney(value);
    if (n !== null) basis = 'DKK_AMOUNT';
  } else if (c) {
    const foreign = parseMoney(value),
      rate = decimal(raw.fxRate);
    if (foreign !== null && rate) {
      const places = rate.split('.')[1]?.length ?? 0;
      const r = places <= 8 ? scaled(rate, places) : null;
      if (r !== null && r > 0) {
        const denominator = 10n ** BigInt(places),
          product = BigInt(Math.abs(foreign)) * r;
        const rounded = (product + denominator / 2n) / denominator;
        if (rounded <= BigInt(Number.MAX_SAFE_INTEGER)) {
          n = Number(rounded);
          basis = 'FX_RATE';
          issues.push(
            issue(
              'FX_RATE_ASSUMED_QUOTE',
              'fxRate',
              'Supplied rate interpreted as DKK per original currency unit.',
            ),
          );
        }
      }
    }
  }
  if (!c)
    issues.push(
      issue('UNKNOWN_CURRENCY', 'amount.currency', 'Source currency is missing or invalid.'),
    );
  if (n === null)
    issues.push(
      issue('UNUSABLE_AMOUNT', 'amount', 'No reliable DKK amount is available.', 'ERROR'),
    );
  return { amountOere: n === null ? null : Math.abs(n), original, conversionBasis: basis };
}
function records(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(obj) : [];
}
function deduplicate(items: RecordValue[], accountId: string, kind: string) {
  const seen = new Set<string>(),
    counts = new Map<string, number>();
  let removed = 0;
  const distinct = items.filter((x) => {
    const key = canonical(x);
    if (seen.has(key)) {
      removed++;
      return false;
    }
    seen.add(key);
    const id = text(x[kind === 'transaction' ? 'id' : 'paymentId']);
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    return true;
  });
  return {
    removed,
    items: distinct.map((raw) => {
      const sourceId = text(raw[kind === 'transaction' ? 'id' : 'paymentId']);
      return {
        raw,
        sourceId,
        id: hash(accountId + ':' + kind + ':' + canonical(raw)),
        collision: sourceId !== null && (counts.get(sourceId) ?? 0) > 1,
      };
    }),
  };
}
export interface NormalizedDataset {
  account: Account;
  ownerId: string;
  transactions: Transaction[];
  payments: PlannedPayment[];
  quality: z.infer<typeof QualitySchema>;
}
export function normalizeDataset(input: unknown, ownerId: string, asOf: Date): NormalizedDataset {
  if (!Number.isFinite(asOf.getTime())) throw new Error('Invalid dataset cutoff');
  const root = obj(input),
    a = obj(root.account),
    accountId = text(a.id);
  if (!accountId) throw new Error('Dataset account requires an ID');
  const accountIssues: DataIssue[] = [];
  const accountCurrency = currency(a.currency);
  if (accountCurrency !== 'DKK') throw new Error('Only DKK accounts are supported');
  const balance = (key: string) => {
    const b = obj(a[key]);
    const c = currency(b.currency ?? b.ccy);
    const n = c === 'DKK' ? parseMoney(b.value) : null;
    if (n === null)
      accountIssues.push(
        issue('UNUSABLE_BALANCE', key, 'Balance is missing or cannot be read in DKK.'),
      );
    return n;
  };
  const digits = text(a.accountNumber)?.replace(/\D/g, '');
  const updated = text(a.lastUpdated);
  const account = AccountSchema.parse({
    id: accountId,
    name: text(a.name) ?? 'Account',
    currency: accountCurrency,
    maskedIdentifier: digits && digits.length >= 4 ? '••••' + digits.slice(-4) : null,
    bookedBalanceOere: balance('bookedBalance'),
    availableBalanceOere: balance('availableBalance'),
    updatedAt: updated && TimestampSchema.safeParse(updated).success ? updated : null,
    issues: accountIssues,
  });
  const cutoff = date(asOf.toISOString())!;
  const tx = deduplicate(records(obj(root.transactions).items), accountId, 'transaction'),
    py = deduplicate(records(obj(root.payments).items), accountId, 'payment');
  const transactions = tx.items.map(({ raw, sourceId, id, collision }) => {
    const issues: DataIssue[] = [];
    if (collision)
      issues.push(
        issue(
          'SOURCE_ID_COLLISION',
          'id',
          'Different source records share an ID and have been retained.',
        ),
      );
    const booked = date(raw.bookedOn),
      fallback = date(raw.valueDate),
      d = booked ?? fallback;
    const dateBasis = booked ? 'BOOKED_ON' : fallback ? 'VALUE_DATE' : 'UNKNOWN';
    if (!booked)
      issues.push(
        issue(
          fallback ? 'DATE_FALLBACK' : 'UNKNOWN_DATE',
          'bookedOn',
          fallback
            ? 'Using value date because booking date is unavailable.'
            : 'Transaction date is unknown.',
        ),
      );
    if (d && d > cutoff)
      issues.push(issue('FUTURE_DATE', 'bookedOn', 'Date is after the dataset cutoff.'));
    const rawStatus = text(raw.status)?.toUpperCase(),
      status = ['BOOK', 'BOOKED', 'COMPLETED'].includes(rawStatus ?? '')
        ? 'BOOKED'
        : ['PENDING', 'RESERVED'].includes(rawStatus ?? '')
          ? 'PENDING'
          : 'UNKNOWN';
    if (status === 'UNKNOWN')
      issues.push(issue('UNKNOWN_STATUS', 'status', 'Transaction status is unknown.'));
    const dir = direction(raw.direction, issues);
    const money = amount(raw, issues);
    const originalNumber = parseMoney(obj(raw.amount).value ?? raw.amount);
    if (
      originalNumber !== null &&
      ((dir === 'CREDIT' && originalNumber < 0) || (dir === 'DEBIT' && originalNumber > 0))
    )
      issues.push(
        issue(
          'SIGN_DIRECTION_CONFLICT',
          'amount',
          'Explicit direction takes precedence over the source sign.',
        ),
      );
    return TransactionSchema.parse({
      id,
      sourceId,
      accountId,
      date: d,
      dateBasis,
      direction: dir,
      status,
      ...money,
      text:
        text(raw.translatedTransactionText) ??
        text(raw.originalTransactionText) ??
        'Unlabelled transaction',
      counterparty: text(raw.counterpartyName),
      issues,
    });
  });
  const payments = py.items.map(({ raw, sourceId, id, collision }) => {
    const issues: DataIssue[] = [];
    if (collision)
      issues.push(issue('SOURCE_ID_COLLISION', 'paymentId', 'Different payments share an ID.'));
    const expectedDate = date(raw.transactionDate);
    if (!expectedDate)
      issues.push(issue('UNKNOWN_DATE', 'transactionDate', 'Expected payment date is unknown.'));
    const statuses = [raw.statusShortId, raw.statusMessage].map((x) => text(x)?.toUpperCase());
    const groups = statuses
      .filter(Boolean)
      .map((s) =>
        s === 'SCH' || s === 'SCHEDULED'
          ? 'SCHEDULED'
          : s === 'CAN' || s === 'CANCELLED'
            ? 'CANCELLED'
            : s === 'PENDING'
              ? 'PENDING'
              : 'UNKNOWN',
      );
    const unique = [...new Set(groups)];
    const status = unique.length === 1 ? unique[0]! : 'UNKNOWN';
    if (status === 'UNKNOWN')
      issues.push(issue('UNKNOWN_STATUS', 'status', 'Payment status is missing or inconsistent.'));
    const recurring =
      raw.isRecurring === true ||
      raw.isRecurring === 1 ||
      ['Y', '1', 'TRUE'].includes(text(raw.isRecurring)?.toUpperCase() ?? '')
        ? true
        : raw.isRecurring === false ||
            raw.isRecurring === 0 ||
            ['N', '0', 'FALSE'].includes(text(raw.isRecurring)?.toUpperCase() ?? '')
          ? false
          : null;
    return PlannedPaymentSchema.parse({
      id,
      sourceId,
      accountId,
      expectedDate,
      direction: direction(raw.direction, issues),
      status,
      ...amount(raw, issues, true),
      recurring,
      text: text(raw.textOnSendersAccountStatement) ?? text(raw.message) ?? 'Unlabelled payment',
      counterparty: text(raw.beneficiaryName),
      issues,
    });
  });
  const dates = transactions
    .map((t) => t.date)
    .filter((x): x is string => x !== null && x <= cutoff)
    .sort();
  const period = obj(obj(root.meta).period);
  const declaredFrom = date(period.from),
    declaredTo = date(period.to);
  const from = declaredFrom ?? dates[0] ?? null,
    to = declaredTo && declaredTo <= cutoff ? declaredTo : (dates.at(-1) ?? null);
  let completeMonths = 0;
  if (from && to && from <= to) {
    let d = new Date(from + 'T00:00:00Z');
    if (d.getUTCDate() !== 1) d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    for (let i = 0; i < 1200; i++) {
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
        .toISOString()
        .slice(0, 10);
      if (end > to) break;
      completeMonths++;
      d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    }
  }
  const issues: DataIssue[] = [];
  for (const key of ['transactions', 'payments'])
    if (obj(root[key]).isSuccess === false)
      issues.push(
        issue('SOURCE_FAILURE', key, 'The source reported an unsuccessful result.', 'ERROR'),
      );
  if (completeMonths < 12)
    issues.push(
      issue(
        'LIMITED_HISTORY',
        null,
        'Fewer than twelve complete calendar months are covered; valid record coverage may be lower.',
      ),
    );
  if (!declaredFrom || !declaredTo)
    issues.push(
      issue(
        'INFERRED_COVERAGE',
        null,
        'Coverage boundaries are inferred from observed records and do not guarantee completeness.',
      ),
    );
  const quality = QualitySchema.parse({
    asOf: asOf.toISOString(),
    coverage: { from, to, completeMonths },
    duplicatesRemoved: tx.removed + py.removed,
    issues,
  });
  return { account, ownerId, transactions, payments, quality };
}
