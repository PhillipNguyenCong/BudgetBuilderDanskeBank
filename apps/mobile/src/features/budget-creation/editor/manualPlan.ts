import type { BudgetPlan } from '@budget-builder/contracts';

/** Structural template only. The editor clears every amount before showing this draft. */
export function manualPlan(): BudgetPlan {
  return {
    name: '',
    income: {
      id: 'income',
      name: 'Income',
      color: 'OCEAN',
      rows: [{ id: 'salary', label: 'Take-home salary', amountOere: 0 }],
    },
    pots: [
      {
        id: 'fixed',
        name: 'Fixed expenses',
        type: 'FIXED_EXPENSE',
        color: 'SAND',
        rows: [],
      },
      {
        id: 'groceries',
        name: 'Groceries',
        type: 'SPENDING',
        purpose: 'GROCERIES',
        color: 'LAVENDER',
        rows: [{ id: 'groceries-row', label: 'Monthly groceries', amountOere: 0 }],
        rollover: { enabled: false, destination: null, targetPotId: null },
      },
      {
        id: 'spending',
        name: 'Fun budget',
        type: 'SPENDING',
        purpose: 'FUN',
        color: 'SKY',
        rows: [{ id: 'spending-row', label: 'Monthly fun', amountOere: 0 }],
        rollover: { enabled: false, destination: null, targetPotId: null },
      },
      {
        id: 'savings',
        name: 'Savings',
        type: 'SAVINGS',
        color: 'MINT',
        rows: [{ id: 'savings-row', label: 'Monthly saving', amountOere: 0 }],
      },
    ],
  };
}
