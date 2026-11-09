import type { BudgetPlan } from '@budget-builder/contracts';

/** Structural template only. The editor clears every amount before showing this draft. */
export function manualPlan(): BudgetPlan {
  return {
    name: '',
    income: {
      id: 'income',
      name: 'Monthly salary',
      color: 'OCEAN',
      rows: [{ id: 'salary', label: 'Take-home salary', amountOere: 0 }],
    },
    pots: [
      {
        id: 'spending',
        name: 'Spending budget',
        type: 'SPENDING',
        color: 'SKY',
        rows: [{ id: 'spending-row', label: 'Everyday spending', amountOere: 0 }],
        rollover: { enabled: false, destination: null, targetPotId: null },
      },
      {
        id: 'fixed',
        name: 'Fixed expenses',
        type: 'FIXED_EXPENSE',
        color: 'SAND',
        rows: [{ id: 'fixed-row', label: 'Rent', amountOere: 0 }],
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
