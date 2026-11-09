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

- Each spending pot can have a saved preference: `TO_SAVINGS` or `TO_NEXT_MONTH`. Automatic rollover is off until the user enables it, optionally during budget setup. They can change or disable it later.
- With automation off, positive month-end leftovers produce a prompt in the monthly summary. The user can choose once, enable that choice for future months, or decide later. Pending leftovers remain visible and are not counted in the next month’s allowance until allocated. See the [creation and rollover flow](docs/budget-creation-flow.md) for deferred decisions.
- Savings rollover requires a selected savings pot in the same account. Carry-forward adds the leftover amount to the same spending pot's next monthly allocation.
- Only positive leftovers roll over, at most once per spending pot and completed month. Zero or negative leftovers do not roll over.
- MonthlyRollover records the completed month, amount, source and actual destination. Later preference changes do not alter past transfers. Monthly results must be preserved.
- Rollover changes the virtual allocation only; it does not change the bank balance or execute a payment.

## Relationship to existing requirements

The [requirements](docs/requirements.md), [user stories](docs/user-stories.md), [architecture](Architecture.md) and [delivery plan](docs/delivery-plan.md) are aligned with this model as of 5 November 2026. FR-01 / US-03 require exactly one account; FR-03 / US-04 define typed pots and salary allocations; FR-04 / US-06 cover monthly and weekly spending guidance with a supplementary daily guide. FR-09–10 / US-11–12 cover saved rollover preferences and completed transfers. This alignment describes intended behaviour, not implemented or tested features. Month-close scheduling and correction policies remain explicit implementation decisions in the delivery plan.

## Backend contract refinement — 9 November 2026

The API represents take-home income as an editable income widget and typed subaccounts as colored widgets containing ordered planning rows. Widget totals are derived, not separate client-authoritative amounts. These rows and display colors support the conceptual domain without creating additional bank accounts. Source explanations distinguish initial suggestions from user planning changes; suggestion generation remains deferred and edits never trigger it.

The backend stores a current plan with a revision and timestamps. It does not yet implement actual-spending assignments, accumulated/reserved balances, monthly history or rollover execution. Stored rollover preferences alone do not imply automated execution. Savings updates require explicit submitted rows. See [contracts](packages/contracts/README.md).
