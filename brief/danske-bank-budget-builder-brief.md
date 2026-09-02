# Danske Bank Budget Builder Brief

## Project Goal

Create a clean, user-friendly budget feature inside the Danske Bank app that helps customers build, understand, and adjust personal budgets with minimal effort.

The feature should make the Danske Bank app feel like the natural place to manage everyday money, not only check balances or transactions.

## Core Customer Problem

Many customers want better control over monthly spending, but budgeting often feels manual, boring, or difficult to maintain. A good in-app budget builder should reduce setup effort and help customers see what is likely to happen before money becomes tight.

## Product Objective

Help customers:

- Create a simple personal budget quickly.
- Understand fixed costs, flexible spending, income, and savings.
- See likely future expenses before they arrive.
- Get practical suggestions without feeling judged or overwhelmed.
- Return to the Danske Bank app regularly to track and improve their budget.

## Target Experience

The feature should feel:

- Simple and calm.
- Trustworthy and bank-grade.
- Easy for non-technical users.
- Focused on everyday financial decisions.
- Helpful without being pushy.

## Suggested Main Flow

1. Customer opens "Budget" in the app.
2. App pre-fills budget categories from transaction history.
3. Customer confirms income, bills, subscriptions, groceries, transport, savings, and other key categories.
4. App creates a monthly budget overview.
5. Customer sees what is left to spend this month.
6. The app automatically predicts upcoming expenses based on recurring transactions and seasonal patterns.
7. Customer sees simple forecast insights, such as upcoming bills, likely overspending, or possible savings.

## MVP Feature Set

- Monthly budget overview.
- Auto-detected categories from bank transactions.
- Manual editing of category amounts.
- Fixed vs flexible expense split.
- Automatic future-expense forecast.
- Non-interactive AI budget calculation layer.
- Alerts when spending is likely to exceed the budget.
- Clear "left to spend" amount for the rest of the month.

## Non-Interactive AI Budget Forecast

The AI should not be a chat assistant or interactive conversation. It should work quietly in the background and automatically calculate likely future expenses from the customer's real banking activity.

The customer should experience the AI through clear numbers, forecast cards, and simple explanations inside the budget screen.

Useful AI calculations:

- Predict future expenses from recurring transactions.
- Estimate end-of-month balance.
- Detect subscriptions and repeated bills.
- Identify seasonal or unusual spending patterns.
- Calculate what the customer is likely to have left until payday.
- Compare current spending pace with the monthly budget.
- Flag categories that are likely to go over budget.
- Estimate possible savings after expected expenses.

AI output should be automatic, short, specific, and based on the customer's actual budget data. The customer should not need to ask questions or type prompts.

## Example AI Insights

- "Your rent and subscriptions are covered. Based on your usual grocery and transport spending, you are likely to have 2,400 DKK left until payday."
- "Your dining-out spending is 35% higher than usual this month. Reducing it by 300 DKK would keep you on track."
- "A recurring insurance payment usually arrives next week. I have included it in your forecast."

## Key Screens

- Budget home: monthly snapshot, left to spend, forecast.
- Budget setup: guided category confirmation.
- Category detail: budgeted amount, spent amount, forecast, transactions.
- Forecast insight panel: automatic calculations and suggested actions.
- Alerts: upcoming bills, overspending risk, savings opportunity.

## Design Principles

- Keep the first screen useful immediately.
- Avoid finance jargon.
- Show numbers with plain labels.
- Make editing categories easy.
- Use progressive detail: summary first, details on tap.
- Make AI feel like automatic budgeting intelligence, not a separate assistant.
- Keep recommendations respectful and optional.

## Success Metrics

- Number of customers who create a budget.
- Percentage of customers who return to the budget feature weekly.
- Number of customers who adjust categories after forecast insights.
- Reduction in customers exceeding self-set budgets.
- Increase in savings goal setup or savings transfers.

## Open Questions

- Should the first version use only transaction data, or also ask customers for expected future one-off expenses?
- Should forecast insights appear as cards, alerts, or both?
- Which customer segment is the first target: students, families, young professionals, or general retail customers?
- Should the feature support shared household budgets?
- How much control should customers have over AI assumptions?

## Next Build Priorities

1. Define the core user journey from opening the app to completing a budget.
2. Sketch the main budget home screen and setup flow.
3. Define the data model for income, categories, transactions, forecasts, and automatic insights.
4. Prototype simple future-expense prediction logic.
5. Test the wording and layout with non-technical users.
