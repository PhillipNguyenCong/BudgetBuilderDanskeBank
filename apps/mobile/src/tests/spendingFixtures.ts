import { calculatePlan } from '@budget-builder/budget-core/allocations';
import {
  createBudgetExample,
  type Budget,
  type ClassifiedTransaction,
  type SpendingSummary,
} from '@budget-builder/contracts';
export function savedBudget(): Budget {
  const plan = structuredClone(createBudgetExample.plan);
  return {
    id: 'saved',
    accountId: 'demo-account',
    plan,
    totals: calculatePlan(plan),
    revision: 1,
    createdAt: '2026-11-09T12:00:00Z',
    updatedAt: '2026-11-09T12:00:00Z',
  };
}
export function activityItem(): ClassifiedTransaction {
  return {
    transaction: {
      id: 'shop',
      sourceId: 'synthetic-shop',
      accountId: 'demo-account',
      date: '2026-10-14',
      dateBasis: 'BOOKED_ON',
      direction: 'DEBIT',
      status: 'BOOKED',
      amountOere: 50000,
      original: { amount: null, currency: 'DKK' },
      conversionBasis: 'DKK_AMOUNT',
      text: 'Synthetic grocery shop',
      counterparty: null,
      issues: [],
    },
    kind: 'EXPENSE',
    potId: 'spending',
    origin: 'AUTO',
    reason: 'Automatically assigned to the first spending pot (default).',
    correctionRevision: 0,
    included: true,
    contribution: 'BOOKED',
    exclusionReason: null,
    needsReview: false,
  };
}
export function spendingSummary(budget = savedBudget()): SpendingSummary {
  const numbers = {
    allocationOere: 800000,
    carriedInOere: 0,
    recordedSpendingOere: 520000,
    pendingSpendingOere: 0,
    unconfirmedSpendingOere: 0,
    reviewAffectingCount: 0,
    remainingOere: 280000,
    overspentOere: 0,
    weeklyGuideDkk: 1153,
    dailyGuideDkk: 165,
    limitations: [],
  };
  return {
    budget,
    account: {
      id: budget.accountId,
      name: 'Everyday account',
      currency: 'DKK',
      maskedIdentifier: '••1234',
      bookedBalanceOere: null,
      availableBalanceOere: null,
      updatedAt: null,
      issues: [],
    },
    snapshotDate: '2026-10-15',
    month: '2026-10',
    daysRemaining: 17,
    mode: 'SOURCE_SNAPSHOT',
    snapshotVersion: 'a'.repeat(64),
    quality: {
      asOf: '2026-10-15T12:00:00Z',
      coverage: { from: '2026-10-01', to: '2026-10-15', completeMonths: 0 },
      duplicatesRemoved: 0,
      issues: [],
    },
    defaultSpendingPotId: 'spending',
    retainedCorrectionCount: 0,
    reviewCount: 0,
    overall: numbers,
    pots: [{ potId: 'spending', numbers }],
    fixedExpenses: [
      {
        potId: 'bills',
        numbers: {
          ...numbers,
          allocationOere: 1200000,
          recordedSpendingOere: 900000,
          remainingOere: 300000,
          weeklyGuideDkk: 1235,
          dailyGuideDkk: 176,
        },
      },
    ],
    recent: [activityItem()],
  };
}
