import { UserProfileSchema } from './users.js';
import { CreateBudgetSchema } from './budgets.js';
export const createBudgetExample = CreateBudgetSchema.parse({
  accountId: 'demo-account',
  plan: {
    name: 'My budget',
    income: {
      id: 'income',
      name: 'Monthly salary',
      color: 'OCEAN',
      rows: [{ id: 'salary', label: 'Take-home salary', amountOere: 2400000 }],
    },
    pots: [
      {
        id: 'spending',
        name: 'Spending budget',
        type: 'SPENDING',
        color: 'SKY',
        rows: [{ id: 'groceries', label: 'Groceries', amountOere: 800000 }],
        rollover: { enabled: false, destination: null, targetPotId: null },
      },
      {
        id: 'bills',
        name: 'Fixed expenses',
        type: 'FIXED_EXPENSE',
        color: 'SAND',
        rows: [
          { id: 'rent', label: 'Rent', amountOere: 900000 },
          { id: 'utilities', label: 'Utilities', amountOere: 150000 },
          { id: 'insurance', label: 'Insurance', amountOere: 90000 },
          { id: 'subscriptions', label: 'Subscriptions', amountOere: 60000 },
        ],
      },
      {
        id: 'savings',
        name: 'Savings',
        type: 'SAVINGS',
        color: 'MINT',
        rows: [{ id: 'rainy-day', label: 'Rainy day', amountOere: 400000 }],
      },
    ],
  },
});

export const userProfileExample = UserProfileSchema.parse({
  id: 'demo-user',
  displayName: 'Demo Customer',
  isDemo: true,
});
