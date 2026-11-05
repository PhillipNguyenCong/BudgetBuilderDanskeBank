# MVP user stories

Status: proposed backlog for discussion and Figma sketches; implementation and evaluation are not asserted. Stories follow the customer journey, starting inside the banking app before the customer opens Budget. Login is outside this flow. Delivery order is documented separately in the [delivery plan](delivery-plan.md).

## Journey overview

| ID | Customer step | Figma screen or state | Status |
| --- | --- | --- | --- |
| US-01 | Navigate to Budget | Primary navigation with Budget active | Draft |
| US-02 | Understand how to start a first budget | Short introduction and Create budget action | Proposed — confirm wording |
| US-03 | Create a separate budget | Budget name and account selection | Draft |
| US-04 | Review suggested budget items | Editable income, expenses and savings | Draft |
| US-05 | Plan for irregular expenses | Payment frequency and date | Draft |
| US-06 | View the budget and compare plan with actual spending | Saved budget overview | Draft |
| US-07 | View an explained cash-flow forecast | Forecast card and explanation | Draft |
| US-08 | Receive an early shortfall warning | Warning with date, amount and explanation | Draft |
| US-09 | Understand spending changes | Category insight | Draft |
| US-10 | Understand data-quality limitations | Contextual uncertainty and review states | Draft |

US-10 applies throughout the journey; it is not a mandatory final screen. Forecasts, warnings and insights can appear together on the overview. These story numbers describe a reading order, not a requirement for separate pages.

## First-visit proposal and open decisions

- A customer without a saved budget sees a short introduction and a clear Create budget action. A completed budget is not assumed to exist.
- Available demo data can provide suggestions during setup. The customer reviews them before saving; suggestions are not presented as an approved budget.
- A returning customer with a saved budget goes to their budget overview. With multiple budgets, the customer can identify and select the budget to view.
- US-02 is a proposed continuation because its requested wording was unfinished. Confirm this proposal and whether a separate introduction screen or an inline empty state is preferable before finalising Figma.
- Use DKK demonstration data in sketches. Figma links can be added to the overview table when available.

## US-01 — Navigate to Budget

As a customer using the Budget feature for the first time, I want to navigate to the Budget tab, so that I can access the feature and see how to get started.

Requirements: entry point supporting FR-01 and FR-04. Personas: P-01, P-02.

### Acceptance criteria

1. Budget is visible and clearly labelled in the app's primary navigation.
2. Selecting Budget opens the feature and marks Budget as the active navigation item.
3. A customer without a saved budget sees the first-budget introduction described in US-02.
4. A customer with a saved budget can access the overview described in US-06.
5. A loading or failed request is not presented as proof that the customer has no budget; a failed request offers a retry.

Figma: show the navigation, the active Budget tab, and the first-time and returning-customer destinations.

## US-02 — Understand how to start a first budget

As a customer without a budget, I want to see a short introduction and a clear way to create my first budget, so that I understand what to do next.

Status: proposed wording for discussion.

Requirements: onboarding supporting FR-01 and FR-02. Persona: P-01.

### Acceptance criteria

1. The first-visit state explains briefly that the customer will select accounts, review suggested items and save a budget.
2. A clearly labelled Create budget action starts the setup described in US-03.
3. No saved budget or approved amounts are implied before the customer has reviewed and saved their budget.
4. Leaving the introduction does not create a budget; reopening Budget without a saved budget still provides a way to start.
5. Customers with an existing budget can reach their overview without repeating this introduction.

Figma: sketch an empty state with a short explanation and one primary Create budget action. A longer tutorial is not assumed.

## US-03 — Create a separate budget

As a customer, I want to create a budget using selected accounts, so that I can manage a specific part of my finances.

Requirements: FR-01. Personas: P-01, P-02.

### Acceptance criteria

1. The customer must provide a non-blank name and select at least one account.
2. Accounts assigned to another budget cannot be selected, and the reason is shown.
3. The customer can review the budget before saving.
4. A successfully saved budget appears separately from existing budgets.
5. A failed save preserves entered information and displays a clear error.

## US-04 — Review suggested budget items

As a customer, I want to review and correct suggested budget items, so that my budget reflects my situation.

Requirements: FR-02, FR-03, FR-06, FR-07. Persona: P-01.

### Acceptance criteria

1. Suggested items distinguish income, fixed expenses, variable expenses and savings.
2. The customer can change an item's category and planned amount before saving.
3. Suggestions provide a short explanation of their source.
4. Uncertain categories are marked for review.
5. Manual corrections remain in place when the budget is reopened.

## US-05 — Plan for irregular expenses

As a customer, I want to include quarterly and annual expenses, so that I can prepare for bills that do not occur every month.

Requirements: FR-03, FR-05, FR-08. Personas: P-01, P-02.

### Acceptance criteria

1. An item can specify a payment amount, frequency and next payment date.
2. The budget displays the equivalent monthly planning amount.
3. The cash-flow forecast includes the full payment on its expected date.
4. The monthly allocation and the actual payment are not counted as two separate cash outflows.

## US-06 — View the budget overview and compare spending

As a customer with a saved budget, I want to see an overview of my budget and compare planned and actual amounts by category, so that I can understand my current budget and see where my spending differs from the plan.

Requirements: FR-03, FR-04, FR-08. Personas: P-01, P-02.

### Acceptance criteria

1. The overview identifies the selected budget and period; customers with multiple budgets can select which one to view.
2. Income, fixed expenses, variable expenses and savings allocations are clearly distinguished. Each category displays its planned amount, actual amount and difference.
3. Actual spending uses eligible booked transactions.
4. Transfers between accounts within the budget do not inflate income or expenses.
5. Categories exceeding their planned spending are identified with text as well as visual styling.
6. The default overview shows the remaining everyday-spending budget and an approximate daily spending guide. Fixed expenses and planned savings are excluded from this amount.
7. For the current month, the daily guide equals the remaining everyday-spending budget divided by the number of calendar days remaining, including today. It updates when recorded spending or the everyday-spending plan changes.
8. The daily guide is rounded to the nearest whole DKK and labelled “About”. The explanation states that it is a guide, not a daily limit or a cash-flow forecast.
9. With DKK 2,800 remaining on 15 October, the overview shows 17 days remaining and about DKK 165 per day. On the last day, the divisor is one.
10. If the everyday-spending budget is exhausted, show DKK 0 available per day; if exceeded, also show the overspent amount explicitly. Do not imply that the account balance is zero.
11. Missing required amounts produce an unavailable guide with an explanation, never a fabricated zero. Past and future months do not show a current daily allowance.

Figma: [Budget prototype](https://www.figma.com/design/0ka6z9Ob7PgioGkZfnEN4V). Daily amounts are budget guidance; forecast warnings remain separately visible.

## US-07 — View an explained cash-flow forecast

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

## US-08 — Receive an early shortfall warning

As a customer, I want to be warned when my balance is projected to become negative, so that I can review my budget before that date.

Requirements: FR-05, FR-06. Persona: P-02.

### Acceptance criteria

1. The forecast evaluates daily balances rather than only the month-end balance.
2. A warning identifies the first projected negative date and estimated balance.
3. The explanation identifies the main expected cash movements contributing to the shortfall.
4. A positive month-end balance does not suppress an earlier shortfall warning.
5. The warning updates when inputs used by the forecast change. Changes to planned spending alone must not alter an estimate unless an explicit forecast rule uses that input.

## US-09 — Understand spending changes

As a customer, I want explanations of significant spending changes, so that I know which categories need my attention.

Requirements: FR-04, FR-06, FR-07. Persona: P-02.

### Acceptance criteria

1. Each insight identifies the category, amount of change and comparison periods.
2. An incomplete month is compared with an equivalent period or clearly labelled otherwise.
3. Percentage change is omitted when the comparison amount is zero.
4. The explanation describes observed patterns without inventing a cause.
5. Insufficient comparison data produces a clear limitation.

Before implementation: agree the threshold for highlighting a change and the exact comparison-window rule.

## US-10 — Understand data-quality limitations

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

All stories are subject to NFR-02 (accessibility), NFR-05 (privacy/security) and NFR-07 (testability). Evaluate NFR-01 through US-01–05, NFR-03 through recalculation flows, NFR-04 through monetary logic and NFR-06 through US-07–10. Requirement definitions are in [requirements.md](requirements.md).

## Story numbering change

Stories were reordered to start with navigation and first-time guidance. Existing acceptance criteria were retained, with the overview clarified. Use this mapping when reading earlier references; new work should use the current IDs.

| Previous ID | Current ID | Story |
| --- | --- | --- |
| US-01 | US-03 | Create a separate budget |
| US-02 | US-04 | Review suggested budget items |
| US-03 | US-05 | Plan for irregular expenses |
| US-04 | US-06 | Compare the plan with actual spending |
| US-05 | US-09 | Understand spending changes |
| US-06 | US-07 | View an explained cash-flow forecast |
| US-07 | US-08 | Receive an early shortfall warning |
| US-08 | US-10 | Understand data-quality limitations |
