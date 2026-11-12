import {
  DateSchema,
  type BudgetPlan,
  type ClassifiedTransaction,
  type SpendingNumbers,
  type Transaction,
  type TransactionCorrection,
} from '@budget-builder/contracts';
import { AllocationError, calculatePlan } from '../allocations/index.js';
import { billMatchScore, billMerchantKeys } from '../bills/matching.js';
import { reconcileTransactions } from './reconcile.js';

function exact(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER))
    throw new AllocationError('AMOUNT_OVERFLOW');
  return Number(value);
}

function money(value: number): bigint {
  if (!Number.isSafeInteger(value)) throw new AllocationError('AMOUNT_OVERFLOW');
  return BigInt(value);
}

export function remainingDays(date: string): number {
  DateSchema.parse(date);
  const day = new Date(`${date}T00:00:00Z`);
  const end = new Date(day);
  end.setUTCMonth(day.getUTCMonth() + 1, 0);
  return end.getUTCDate() - day.getUTCDate() + 1;
}

/** Rounding happens once, directly from the exact rational number to whole DKK. */
export function calculateGuidance(
  allocationOere: number,
  carriedInOere: number,
  recordedSpendingOere: number,
  date: string,
  limitations: string[] = [],
  commitments: {
    pendingSpendingOere?: number;
    unconfirmedSpendingOere?: number;
    reviewAffectingCount?: number;
  } = {},
): SpendingNumbers {
  if (allocationOere < 0 || carriedInOere < 0) throw new AllocationError('AMOUNT_OVERFLOW');
  const pendingSpendingOere = commitments.pendingSpendingOere ?? 0;
  const unconfirmedSpendingOere = commitments.unconfirmedSpendingOere ?? 0;
  const reviewAffectingCount = commitments.reviewAffectingCount ?? 0;
  if (
    pendingSpendingOere < 0 ||
    unconfirmedSpendingOere < 0 ||
    !Number.isSafeInteger(reviewAffectingCount) ||
    reviewAffectingCount < 0
  )
    throw new AllocationError('AMOUNT_OVERFLOW');
  const available = money(allocationOere) + money(carriedInOere);
  exact(available);
  const remaining =
    available -
    money(recordedSpendingOere) -
    money(pendingSpendingOere) -
    money(unconfirmedSpendingOere);
  const signed = exact(remaining);
  const days = remainingDays(date);
  const positive = remaining > 0n ? remaining : 0n;
  const denominator = BigInt(days * 100);
  const rounded = (factor: number) =>
    exact((positive * BigInt(factor) + denominator / 2n) / denominator);
  return {
    allocationOere,
    carriedInOere,
    recordedSpendingOere,
    pendingSpendingOere,
    unconfirmedSpendingOere,
    reviewAffectingCount,
    remainingOere: limitations.length ? null : signed,
    overspentOere: limitations.length ? null : exact(remaining < 0n ? -remaining : 0n),
    weeklyGuideDkk: limitations.length ? null : rounded(Math.min(7, days)),
    dailyGuideDkk: limitations.length ? null : rounded(1),
    limitations,
  };
}

export type SpendingCorrectionInput = TransactionCorrection & { sourceId: string | null };

const phrase = (value: string) =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const matches = (label: string, description: string) => {
  const normalized = phrase(label);
  return normalized.length >= 3 && ` ${phrase(description)} `.includes(` ${normalized} `);
};

type SnapshotInput = {
  plan: BudgetPlan;
  accountId: string;
  transactions: readonly Transaction[];
  corrections: readonly SpendingCorrectionInput[];
  date: string;
  coverage: { from: string | null; to: string | null; completeMonths: number };
};

type ActivityDraft = Omit<
  ClassifiedTransaction,
  'contribution' | 'included' | 'exclusionReason'
> & {
  selected: boolean;
  conflictingSourceVersions: boolean;
};

function classify(input: SnapshotInput): ActivityDraft[] {
  const spending = input.plan.pots.filter((pot) => pot.type === 'SPENDING');
  const defaultPot = spending[0]?.id ?? null;
  const corrections = new Map(
    input.corrections.map((correction) => [correction.transactionId, correction]),
  );
  const reconciled = reconcileTransactions(input.transactions, input.accountId);
  const currentIds = new Set(reconciled.map((record) => record.transaction.id));

  return reconciled.map((record) => {
    const tx = record.transaction;
    const correction = corrections.get(tx.id);
    let kind: ClassifiedTransaction['kind'] = 'UNKNOWN';
    let potId: string | null = null;
    let reason = 'Direction is unknown; review this record.';
    let origin: ClassifiedTransaction['origin'] = 'AUTO';
    let ambiguous = false;
    let billRowId: string | null = null;
    if (correction?.decision) {
      ({ kind, potId } = correction.decision);
      origin = 'CUSTOMER';
      reason = 'Classification confirmed by you.';
      const target = input.plan.pots.find((pot) => pot.id === potId);
      if (
        (kind === 'EXPENSE' &&
          (!target || target.type === 'SAVINGS' || tx.direction !== 'DEBIT')) ||
        (kind === 'REFUND' &&
          (!target || target.type === 'SAVINGS' || tx.direction !== 'CREDIT')) ||
        (kind === 'CREDIT' && tx.direction !== 'CREDIT')
      ) {
        kind = 'UNKNOWN';
        potId = null;
        reason = 'The saved correction no longer has an eligible target or direction.';
      }
    } else if (
      !correction &&
      input.corrections.some(
        (saved) =>
          saved.decision &&
          saved.sourceId !== null &&
          saved.sourceId === tx.sourceId &&
          saved.transactionId !== tx.id &&
          !currentIds.has(saved.transactionId),
      )
    ) {
      reason = 'The source record changed. Its earlier correction is retained for review.';
    } else if (tx.transferEvidence) {
      kind = 'TRANSFER';
      reason = 'Explicit source evidence identifies an internal transfer.';
    } else if (tx.direction === 'CREDIT') {
      kind = 'CREDIT';
      reason = 'Money in is separate from spending; it is not automatically a refund or salary.';
    } else if (tx.direction === 'DEBIT') {
      const description = `${tx.text} ${tx.counterparty ?? ''}`;
      const billMatches = input.plan.pots.flatMap((pot) =>
        pot.type === 'FIXED_EXPENSE'
          ? pot.rows.map((row) => ({
              potId: pot.id,
              rowId: row.id,
              score: billMatchScore(
                tx,
                row.match ?? {
                  merchantKeys: billMerchantKeys({ text: row.label, counterparty: null }).filter(
                    (key) => key.startsWith('known:'),
                  ),
                },
              ),
            }))
          : [],
      );
      const bestScore = Math.max(0, ...billMatches.map((match) => match.score));
      const best = billMatches.filter((match) => match.score > 0 && match.score === bestScore);
      if (best.length === 1) {
        kind = 'EXPENSE';
        potId = best[0]!.potId;
        billRowId = best[0]!.rowId;
        reason = 'Automatically matched the saved bill merchant connection.';
      } else if (best.length > 1) {
        ambiguous = true;
        const targets = new Set(best.map((match) => match.potId));
        potId = targets.size === 1 ? best[0]!.potId : null;
        kind = potId ? 'EXPENSE' : 'UNKNOWN';
        reason =
          'Several saved bills match this merchant. The movement is counted once; bill attribution needs review.';
      } else {
        const found = input.plan.pots.filter(
          (pot) =>
            pot.type !== 'SAVINGS' &&
            ((pot.type === 'SPENDING' && matches(pot.name, description)) ||
              pot.rows.some((row) =>
                !('match' in row) || !row.match ? matches(row.label, description) : false,
              )),
        );
        if (found.length > 1) {
          ambiguous = true;
          reason = 'Several pots match this transaction. Its spending attribution is uncertain.';
        } else {
          potId = found[0]?.id ?? defaultPot;
          kind = potId ? 'EXPENSE' : 'UNKNOWN';
          reason = found.length
            ? 'Automatically matched a saved pot or bill label.'
            : defaultPot
              ? 'Automatically assigned to the first spending pot (default).'
              : 'There is no spending pot for unmatched transactions.';
        }
      }
    }
    return {
      transaction: tx,
      kind,
      potId,
      billRowId,
      origin,
      reason,
      correctionRevision: correction?.revision ?? 0,
      needsReview:
        record.conflictingSourceVersions ||
        ambiguous ||
        kind === 'UNKNOWN' ||
        tx.status === 'UNKNOWN' ||
        ((kind === 'EXPENSE' || kind === 'REFUND') &&
          (tx.amountOere === null || !Number.isSafeInteger(tx.amountOere) || !tx.date)),
      selected: record.selected,
      conflictingSourceVersions: record.conflictingSourceVersions,
    };
  });
}

function materialize(draft: ActivityDraft, date: string): ClassifiedTransaction {
  const tx = draft.transaction;
  const month = date.slice(0, 7);
  const expense = draft.kind === 'EXPENSE' || draft.kind === 'REFUND';
  const validAmount =
    tx.amountOere !== null && Number.isSafeInteger(tx.amountOere) && tx.amountOere >= 0;
  const inPeriod = !!tx.date && tx.date.startsWith(month) && tx.date <= date;
  let contribution: ClassifiedTransaction['contribution'] = 'NONE';
  if (draft.selected && expense && validAmount && inPeriod && draft.potId) {
    if (tx.status === 'BOOKED') contribution = 'BOOKED';
    else if (draft.kind === 'EXPENSE' && tx.status === 'PENDING') contribution = 'PENDING';
    else if (draft.kind === 'EXPENSE' && tx.status === 'UNKNOWN') contribution = 'UNCONFIRMED';
  }
  const included = contribution === 'BOOKED';
  const exclusionReason = included
    ? null
    : !draft.selected
      ? 'Replaced by another version of the same source movement; not counted twice.'
      : tx.status === 'CANCELLED'
        ? 'Cancelled or released movement; it does not reduce the budget.'
        : contribution === 'PENDING'
          ? 'Pending commitment; included in the available budget, not booked spending.'
          : contribution === 'UNCONFIRMED'
            ? 'Booking status is unknown; included conservatively and marked for review.'
            : draft.kind === 'TRANSFER'
              ? 'Transfer; excluded from spending.'
              : draft.kind === 'CREDIT'
                ? 'Credit; not offset against spending.'
                : draft.kind === 'UNKNOWN'
                  ? draft.reason
                  : !tx.date
                    ? 'Transaction date is unknown.'
                    : !validAmount
                      ? 'Transaction amount is unavailable.'
                      : tx.date > date
                        ? 'After the source snapshot date.'
                        : !tx.date.startsWith(month)
                          ? 'Outside this snapshot month.'
                          : 'Not included in this budget calculation.';
  return {
    transaction: tx,
    kind: draft.kind,
    potId: draft.potId,
    billRowId: draft.billRowId,
    origin: draft.origin,
    reason: draft.reason,
    correctionRevision: draft.correctionRevision,
    contribution,
    included,
    exclusionReason,
    needsReview: draft.needsReview,
  };
}

function signedAmount(activity: ClassifiedTransaction): bigint {
  return BigInt(activity.transaction.amountOere!) * (activity.kind === 'REFUND' ? -1n : 1n);
}

/**
 * Authoritative live-budget algorithm. It reconciles source versions, classifies every movement,
 * and derives Spending and Fixed expenses guidance from one deterministic snapshot.
 */
export function calculateLiveBudgetSnapshot(input: SnapshotInput) {
  DateSchema.parse(input.date);
  const month = input.date.slice(0, 7);
  const totals = calculatePlan(input.plan);
  const defaultPot = input.plan.pots.find((pot) => pot.type === 'SPENDING')?.id ?? null;
  const activity = classify(input)
    .map((draft) => materialize(draft, input.date))
    .sort(
      (left, right) =>
        (right.transaction.date ?? '').localeCompare(left.transaction.date ?? '') ||
        left.transaction.id.localeCompare(right.transaction.id),
    );
  const coverageComplete =
    input.coverage.from !== null &&
    input.coverage.to !== null &&
    input.coverage.from <= `${month}-01` &&
    input.coverage.to >= input.date;
  const monthRelevant = (item: ClassifiedTransaction) =>
    !item.transaction.date ||
    (item.transaction.date.startsWith(month) && item.transaction.date <= input.date);

  const numbersFor = (potId: string) => {
    const relevant = activity.filter((item) => item.potId === potId);
    const sum = (contribution: ClassifiedTransaction['contribution']) =>
      relevant
        .filter((item) => item.contribution === contribution)
        .reduce((total, item) => total + signedAmount(item), 0n);
    const limitations: string[] = [];
    if (!coverageComplete)
      limitations.push('Source coverage does not span this month through the snapshot date.');
    if (
      activity.some(
        (item) =>
          item.needsReview &&
          monthRelevant(item) &&
          item.contribution === 'NONE' &&
          (item.potId === potId || item.potId === null) &&
          (item.kind === 'EXPENSE' || item.kind === 'REFUND' || item.kind === 'UNKNOWN') &&
          item.transaction.status !== 'CANCELLED' &&
          !item.exclusionReason?.startsWith('Replaced by'),
      )
    )
      limitations.push(
        'A transaction is missing information needed for this pot. Review account activity.',
      );
    const reviewAffectingCount = activity.filter(
      (item) =>
        item.needsReview && monthRelevant(item) && (item.potId === potId || item.potId === null),
    ).length;
    const allocation = totals.pots.find((pot) => pot.id === potId)!.allocationOere;
    return calculateGuidance(allocation, 0, exact(sum('BOOKED')), input.date, limitations, {
      pendingSpendingOere: exact(sum('PENDING')),
      unconfirmedSpendingOere: exact(sum('UNCONFIRMED')),
      reviewAffectingCount,
    });
  };

  const pots = input.plan.pots
    .filter((pot) => pot.type === 'SPENDING')
    .map((pot) => ({ potId: pot.id, numbers: numbersFor(pot.id) }));
  const fixedExpenses = input.plan.pots
    .filter((pot) => pot.type === 'FIXED_EXPENSE')
    .map((pot) => ({ potId: pot.id, numbers: numbersFor(pot.id) }));
  const overallLimitations = [...new Set(pots.flatMap((pot) => pot.numbers.limitations))];
  if (!pots.length) overallLimitations.push('No spending pots have been created.');
  const total = (
    field:
      'allocationOere' | 'recordedSpendingOere' | 'pendingSpendingOere' | 'unconfirmedSpendingOere',
  ) => exact(pots.reduce((sum, pot) => sum + money(pot.numbers[field]), 0n));

  return {
    activity,
    pots,
    fixedExpenses,
    defaultSpendingPotId: defaultPot,
    retainedCorrectionCount: input.corrections.filter(
      (correction) => !activity.some((item) => item.transaction.id === correction.transactionId),
    ).length,
    reviewCount: activity.filter((item) => item.needsReview).length,
    overall: calculateGuidance(
      total('allocationOere'),
      0,
      total('recordedSpendingOere'),
      input.date,
      overallLimitations,
      {
        pendingSpendingOere: total('pendingSpendingOere'),
        unconfirmedSpendingOere: total('unconfirmedSpendingOere'),
        reviewAffectingCount: activity.filter(
          (item) =>
            item.needsReview &&
            monthRelevant(item) &&
            (item.potId === null || pots.some((pot) => pot.potId === item.potId)),
        ).length,
      },
    ),
  };
}

/** Kept for existing backend callers while the public name moves to the live-budget vocabulary. */
export const buildSpendingSnapshot = calculateLiveBudgetSnapshot;

export { reconcileTransactions } from './reconcile.js';
