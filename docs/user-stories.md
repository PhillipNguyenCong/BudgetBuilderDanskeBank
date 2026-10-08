# MVP user stories

Status: proposed backlog; implementation and evaluation are not asserted. Criteria are numbered so tests and issues can reference a specific expectation. All eight stories belong to the proposed MVP; delivery order is in the [delivery plan](delivery-plan.md).

## US-01 — Create a separate budget

As a customer, I want to create a budget using selected accounts, so that I can manage a specific part of my finances.

Requirements: FR-01. Personas: P-01, P-02.

### Acceptance criteria

1. The customer must provide a non-blank name and select at least one account.
2. Accounts assigned to another budget cannot be selected, and the reason is shown.
3. The customer can review the budget before saving.
4. A successfully saved budget appears separately from existing budgets.
5. A failed save preserves entered information and displays a clear error.

## US-02 — Review suggested budget items

As a customer, I want to review and correct suggested budget items, so that my budget reflects my situation.

Requirements: FR-02, FR-03, FR-06, FR-07. Persona: P-01.

### Acceptance criteria

1. Suggested items distinguish income, fixed expenses, variable expenses and savings.
2. The customer can change an item's category and planned amount before saving.
3. Suggestions provide a short explanation of their source.
4. Uncertain categories are marked for review.
5. Manual corrections remain in place when the budget is reopened.

## US-03 — Plan for irregular expenses

As a customer, I want to include quarterly and annual expenses, so that I can prepare for bills that do not occur every month.

Requirements: FR-03, FR-05, FR-08. Personas: P-01, P-02.

### Acceptance criteria

1. An item can specify a payment amount, frequency and next payment date.
2. The budget displays the equivalent monthly planning amount.
3. The cash-flow forecast includes the full payment on its expected date.
4. The monthly allocation and the actual payment are not counted as two separate cash outflows.

## US-04 — Compare the plan with actual spending

As a customer, I want to compare planned and actual amounts by category, so that I can see where my spending differs from my budget.

Requirements: FR-03, FR-04, FR-08. Personas: P-01, P-02.

### Acceptance criteria

1. The overview identifies the selected budget and period.
2. Each category displays its planned amount, actual amount and difference.
3. Actual spending uses eligible booked transactions.
4. Transfers between accounts within the budget do not inflate income or expenses.
5. Categories exceeding their planned spending are identified with text as well as visual styling.

## US-05 — Understand spending changes

As a customer, I want explanations of significant spending changes, so that I know which categories need my attention.

Requirements: FR-04, FR-06, FR-07. Persona: P-02.

### Acceptance criteria

1. Each insight identifies the category, amount of change and comparison periods.
2. An incomplete month is compared with an equivalent period or clearly labelled otherwise.
3. Percentage change is omitted when the comparison amount is zero.
4. The explanation describes observed patterns without inventing a cause.
5. Insufficient comparison data produces a clear limitation.

Before implementation: agree the threshold for highlighting a change and the exact comparison-window rule.

## US-06 — View an explained cash-flow forecast

As a customer, I want to see my expected end-of-month balance and its main drivers, so that I can plan my remaining spending.

Requirements: FR-05, FR-06, FR-07, FR-08. Persona: P-02.

### Acceptance criteria

1. The forecast uses balances, eligible upcoming payments and estimated variable spending for the selected budget.
2. It displays the calculation date and forecast horizon.
3. It explains expected income, upcoming expenses and estimated variable spending.
4. It remains visually distinct from the customer's budget plan.
5. Estimates are not automatically capped by planned spending limits.
6. When essential data is missing, the system explains why a reliable forecast cannot be shown.

Before implementation: document the balance basis, historical coverage requirement, reconciliation rules and date conventions.

## US-07 — Receive an early shortfall warning

As a customer, I want to be warned when my balance is projected to become negative, so that I can review my budget before that date.

Requirements: FR-05, FR-06. Persona: P-02.

### Acceptance criteria

1. The forecast evaluates daily balances rather than only the month-end balance.
2. A warning identifies the first projected negative date and estimated balance.
3. The explanation identifies the main expected cash movements contributing to the shortfall.
4. A positive month-end balance does not suppress an earlier shortfall warning.
5. The warning updates when inputs used by the forecast change. Changes to planned spending alone must not alter an estimate unless an explicit forecast rule uses that input.

## US-08 — Understand data-quality limitations

As a customer, I want to know when incomplete or inconsistent data affects my budget, so that I can interpret the results appropriately.

Requirements: FR-06, FR-07, FR-08. Personas: P-01, P-02.

### Acceptance criteria

1. Missing amounts are never interpreted as zero.
2. Records with uncertain dates, amounts or directions are marked for review.
3. Affected calculations state whether records were excluded or whether a result could not be produced.
4. Duplicate transactions and overlapping payment expectations do not inflate totals.
5. Cancelled payments are excluded from future cash outflows.
6. The customer sees a plain-language explanation of the issue and any available corrective action.

## Cross-cutting quality criteria

All stories are subject to NFR-02 (accessibility), NFR-05 (privacy/security) and NFR-07 (testability). Evaluate NFR-01 through US-01–03, NFR-03 through recalculation flows, NFR-04 through monetary logic and NFR-06 through US-05–08. Requirement definitions are in [requirements.md](requirements.md).
