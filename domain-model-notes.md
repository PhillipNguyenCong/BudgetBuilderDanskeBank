# Budget domain model

A simplified conceptual model of the agreed design, not an implemented database schema. All amounts are in DKK. Identifiers and technical metadata are omitted for readability.

![Budget domain model](domain-model.png)

[Mermaid source](domain-model.mmd)

## Main rules

- A user can create multiple budgets. Each budget uses exactly one account, and an account belongs to at most one budget. The account must belong to that user.
- Subaccounts are named virtual pots within the account. Each has exactly one type: savings, spending, or fixed expense.
- The user divides monthly take-home salary between the pots. Total monthly allocations cannot exceed that salary.
- Savings accumulate across months. Fixed-expense allocations reserve money for bills.
- Transactions record actual income, expenses, or transfers. A transaction can be assigned to one pot or remain unassigned. Transfers are not income or spending.
- Remaining monthly spending equals monthly allocation plus carried-in money minus actual spending for the current month.
- Weekly allowance equals the positive remaining amount divided by remaining calendar days, including today, multiplied by the smaller of seven and the remaining days. Overspending is shown separately and gives a zero allowance.
- Forecasts represent estimates, distinct from spending allowances. A warning explains a projected shortfall. Detailed bill schedules, categorisation and forecasting inputs are omitted from this overview, not removed from the product scope.

## Month-end rollover

- Each spending pot has a saved preference that the user can change: `TO_SAVINGS` or `TO_NEXT_MONTH`.
- Savings rollover requires a selected savings pot in the same account. Carry-forward adds the leftover amount to the same spending pot's next monthly allocation.
- Only positive leftovers roll over, at most once per spending pot and completed month. Zero or negative leftovers do not roll over.
- MonthlyRollover records the completed month, amount, source and actual destination. Later preference changes do not alter past transfers. Monthly results must be preserved.
- Rollover changes the virtual allocation only; it does not change the bank balance or execute a payment.

## Relationship to existing requirements

This design narrows the earlier one-or-more-accounts baseline in FR-01 / US-03 to exactly one account per budget. Weekly guidance supplements the daily guide in US-06. These are design decisions from 5 November 2026; implementation must explicitly align the existing requirements and acceptance criteria. This documentation does not claim that those features are implemented or tested.
