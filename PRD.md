# Product Requirements Document

## Product Goal

Create a clean, user-friendly budget feature inside the Danske Bank app experience that helps customers build, understand, and adjust personal budgets with minimal effort.

The feature should make the bank app feel like the natural place to manage everyday money, not only a place to check balances or transactions.

## Customer Problem

Many customers want better control over monthly spending, but budgeting often feels manual, boring, or difficult to maintain.

The product should reduce setup effort and help customers see what is likely to happen before money becomes tight.

## Target Experience

The experience should feel:

- Simple and calm.
- Trustworthy and bank-grade.
- Easy for non-technical users.
- Focused on everyday financial decisions.
- Helpful without being pushy.

## MVP Scope

The first prototype should include:

- Monthly budget overview.
- Auto-detected budget categories from sample transaction data.
- Manual category editing as a planned interaction.
- Fixed vs flexible expense split.
- Automatic future-expense forecast.
- Non-interactive budget intelligence layer.
- Alerts when spending is likely to exceed budget.
- Clear left-to-spend amount for the rest of the month.

## Main Flow

1. Customer opens Budget.
2. The app pre-fills categories from transaction history.
3. Customer confirms income, bills, subscriptions, groceries, transport, savings, and other key categories.
4. The app creates a monthly budget overview.
5. Customer sees what is left to spend this month.
6. The app predicts upcoming expenses from recurring payments and spending patterns.
7. Customer sees simple forecast insights.

## AI And Forecasting

The AI should not be an interactive chat assistant.

It should work quietly in the background and produce:

- Predicted future expenses.
- Estimated end-of-month balance.
- Detected subscriptions and repeated bills.
- Unusual spending signals.
- Left-to-spend estimate until payday.
- Category overspending risk.
- Possible savings after expected expenses.

AI output should be automatic, short, specific, and based on the sample budget data.

## First Feature

Build the Budget Home screen first:

- Monthly income.
- Fixed expenses.
- Flexible spending.
- Savings.
- Left to spend.
- Upcoming recurring payments.
- One or two automatic forecast insights.

