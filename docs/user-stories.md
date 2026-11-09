# MVP user stories

Status: agreed customer-flow baseline with implementation status checked against the current repository. Acceptance criteria describe the intended complete behavior; a partial implementation is not an accepted end-to-end story. Login is outside this prototype. Delivery order is in the [delivery plan](delivery-plan.md).

## Journey and implementation overview

| ID | Customer step | Current status |
| --- | --- | --- |
| US-01 | Open Budget through Home / Budget / Cards / More | Partial: native tabs and Budget start route; saved-budget routing pending |
| US-02 | Understand the introduction and start setup | Partial: introduction and active Create budget action; returning-customer flow pending |
| US-03 | Select one account, review and create a budget | Partial: native account selection and backend create API; native editor/save pending |
| US-04 | Review initial AI suggestions and edit allocation widgets | Partial: backend rows, colors and totals; suggestion generation and native widgets pending |
| US-05 | Understand and plan irregular bills | Planned: schedules and monthly normalization of recurring bills are not implemented by free-form rows |
| US-06 | View remaining spending and pot details | Planned: saved overview, transaction attribution and allowance calculations pending |
| US-07 | View a separate balance forecast | Planned: forecast calculation and native card pending |
| US-08 | See a relevant shortfall warning | Planned |
| US-09 | Understand spending changes within the budget | Deferred: no separate insight journey in the active flow |
| US-10 | Understand data limitations and recover from errors | Partial: normalization, API issues/coverage and native account loading/error states |
| US-11 | Set optional automatic rollover | Partial: backend preference validation/persistence; native settings and execution pending |
| US-12 | Review monthly results and rollover history | Planned: month closure, history and fallback decisions pending |
| US-13 | Edit an existing budget without regenerating suggestions | Partial: revision-controlled backend update; native edit flow pending |
| US-14 | Save for an item after budget creation | Planned prototype extension: sample proposal only; domain/API and recommendation logic deferred |

US-10 applies throughout. Figma is a design/prototype reference, not evidence of production behavior or device verification. Native code currently ends at account selection: **Create budget is active; Continue is disabled**, and no budget is created from the app. Physical-device checks remain pending in the recorded verification.

## Agreed flows

- **Create:** Budget introduction → Create budget → select an owned, unused account → initial AI-suggested widgets → review/edit rows and optional rollover → Create budget → saved overview.
- **Edit:** overview → Edit budget → confirm the existing, fixed account → edit saved widgets → Save changes. Do not regenerate suggestions.
- **After creation:** overview → pot details, rollover settings, monthly history or Save for an item. Goals are unavailable during initial setup.
- **Month-end:** enabled automation applies positive leftovers once; otherwise the monthly summary offers a one-time destination, future automation or postponement. These are virtual allocations, not bank transfers.
- Keep one Budget destination, bank header and bottom navigation. Do not reintroduce separate Budget/Savings tabs, customizable dashboard widgets, manual savings-contribution journeys, transfer confirmations, category customization or separate insight journeys. Editable allocation-widget colors remain part of setup/editing.

The app uses a server-controlled demo profile and approved local data, not login or live banking. The supplied dataset covers 1 July–3 September 2026 (two complete calendar months); it cannot substantiate a twelve-month suggestion. Figma's October 2025–September 2026 history is illustrative only.

## US-01 — Navigate to Budget

As a customer using the Budget feature for the first time, I want to navigate to the Budget tab, so that I can access the feature and see how to get started.

Requirements: entry point supporting FR-01 and FR-04. Personas: P-01, P-02.

### Acceptance criteria

1. Home, Budget, Cards and More are clearly labelled native tabs. Cold launch opens Budget; the other three tabs remain explicit demo screens until separately implemented.
2. Selecting Budget opens the feature and marks Budget as the active navigation item.
3. A customer without a saved budget sees the first-budget introduction described in US-02.
4. A customer with a saved budget can access the overview described in US-06.
5. A loading or failed request is not presented as proof that the customer has no budget; a failed request offers a retry.

Figma: show the navigation, the active Budget tab, and the first-time and returning-customer destinations.

## US-02 — Understand how to start a first budget

As a customer without a budget, I want to see a short introduction and a clear way to create my first budget, so that I understand what to do next.

Requirements: onboarding supporting FR-01 and FR-02. Persona: P-01.

### Acceptance criteria

1. The first-visit state explains briefly that the customer will select one account, review named pots and salary allocations, and save a budget.
2. A clearly labelled Create budget action starts the setup described in US-03.
3. No saved budget or approved amounts are implied before the customer has reviewed and saved their budget.
4. Leaving the introduction does not create a budget; reopening Budget without a saved budget still provides a way to start.
5. Customers with an existing budget can reach their overview without repeating this introduction.

Design: use the agreed “Your money, organised” introduction, one Create budget action and the explanation “Pots divide the money in your account. No bank transfer is made.”

## US-03 — Select an account and create a separate budget

As a customer, I want to select one of my accounts and review a budget before accepting it, so that the plan applies to the right money.

Requirements: FR-01, FR-07. Personas: P-01, P-02.

### Acceptance criteria

1. Create budget opens account selection. Show owned account names, masked identifiers, available balances and actual source-history coverage. An unknown balance is not zero.
2. Select exactly one account. Accounts with existing budgets are disabled with a reason. Loading, no accounts, all accounts used, and failed account/eligibility reads have explicit states; errors offer Try again and cannot be interpreted as eligible accounts.
3. Continue opens the initial suggestion/review in US-04. A nonblank budget name is required before saving. Choosing an account or reviewing suggestions does not create a saved budget.
4. Create budget saves only the accepted plan. The backend rechecks ownership and enforces one budget per account atomically, even if another request used the account after selection.
5. A successful save opens the new budget overview, separate from other budgets. Failed saves preserve inputs and explain the problem; an occupied-account conflict cannot silently switch accounts.
6. Back/cancel does not persist a budget. Loading requests are cancelled when leaving account selection. Account assignment becomes fixed once created; later edits follow US-13.

Current native slice: criteria 1–2 and back/cancellation are implemented. Continue remains disabled until the editor exists. Backend creation is implemented separately; see [account-selection verification](mobile-account-selection-story.md) and [backend criteria](backend-foundation-story.md).

## US-04 — Review an AI-suggested budget and edit widgets

As a customer, I want an explained starting suggestion that I can edit directly, so that I can create a personal plan without accepting unexplained amounts.

Requirements: FR-02, FR-03, FR-06, FR-07, FR-08. Persona: P-01.

### Acceptance criteria

1. After account selection, present “Your suggested budget” and an explanation that the initial suggestion uses available spending history and can be adjusted before creation. This is an AI-suggested allocation, distinct from the future-balance forecast in US-07; no chatbot is introduced.
2. Use the previous twelve complete months of eligible transactions from the selected account when available. Separate everyday spending and fixed expenses, exclude salary/transfers from spending, and spread quarterly/annual bills into monthly planning amounts without double counting. Show actual coverage and limitations; with no usable history offer manual allocation without invented amounts.
3. Start with four full-width expandable widgets: Monthly salary, Spending budget, Fixed expenses and Savings. Monthly salary represents income, not a fourth pot type. Each pot has exactly one type: Spending, Fixed expenses or Savings.
4. Clicking a widget expands inline rows and source explanations: text field on the left, whole-DKK amount field on the right. Show the source period and short calculation descriptions for suggestions. Edited planning amounts are labelled “Adjusted by you” and remain distinguishable from historical evidence.
5. Customers can edit widget names, row text and amounts, and add/remove rows. Recalculate each read-only widget total immediately from its rows. Replace the old ±500 controls and separate amount editor with direct input. Financial persistence uses exact integer øre; the server validates and derives totals again.
6. Customers can add named pots during creation/editing and choose a type when adding. Editing an existing pot changes its name, rows, allocation or color, not its type. Offer six readable color tokens (OCEAN, SKY, MINT, LAVENDER, SAND, ROSE); type is always named in text. Add-row/add-pot controls are repeatable, not limited by the number of Figma demonstration examples.
7. Names/row labels must be nonblank and amounts non-negative. Require at least one pot. Show income, total allocation and unallocated salary. Over-allocation shows the shortfall and blocks creation/save without discarding inputs; positive unallocated money is allowed.
8. Initial suggested savings equals salary minus suggested spending and fixed expenses. If expected expenses exceed salary, suggest zero savings, show the shortfall and require adjustments. Do not hide excessive suggested expenses by silently reducing them.
9. After the initial suggestion, user edits take precedence. Changes to income or expenses never silently redistribute savings. Offer an explicit Update savings review with the affected rows/pots and before/after amounts; apply only on confirmation. Cancellation preserves current inputs.
10. Optional automatic rollover is available during setup under US-11. Skipping it does not block creation. Explain once that pots are virtual allocations within the same account; no bank transfer is made.
11. Suggestions and edits remain drafts until Create budget succeeds. Reopening a saved budget preserves names, colors, rows, amounts and rollover settings. Subsequent editing follows US-13 and never reruns initial suggestions.

### Consistent prototype examples

- Income DKK 24,000; spending DKK 8,000; fixed expenses DKK 12,000; savings DKK 4,000; unallocated DKK 0.
- Fixed-expense rows: rent 9,000, utilities 1,500, insurance 900 and subscriptions 600. Explain insurance as 2,700 quarterly divided by three; monthly equivalents are not extra payments.
- Demonstrate three successive row additions and two additional pots in Figma, plus name/amount/color edits, collapse/expand, over-allocation and failed-save input retention. These are demonstration examples, not product limits.
- The twelve-month Figma example is sample data. Native suggestions must disclose the actual shorter local dataset. AI generation is not implemented by the existing normalization or budget-save endpoints.

## US-05 — Plan for irregular expenses

As a customer, I want to include quarterly and annual expenses, so that I can prepare for bills that do not occur every month.

Requirements: FR-03, FR-05, FR-08. Personas: P-01, P-02.

### Acceptance criteria

1. Expanded fixed-expense rows explain monthly amounts and irregular-bill source calculations. Detailed bill information can include payment amount, frequency and next payment date within the pot; a separate setup journey is not required. Free-form planning rows alone do not implement a bill schedule.
2. The budget displays the equivalent monthly planning amount: DKK 2,700 quarterly gives DKK 900/month. The original payment frequency and expected date remain distinct from this allocation.
3. The cash-flow forecast includes the full payment on its expected date.
4. The monthly allocation and the actual payment are not counted as two separate cash outflows.

## US-06 — View the budget overview and compare spending

As a customer with a saved budget, I want to see an overview of my budget and compare planned and actual amounts by subaccount, so that I can understand my current budget and see where my spending differs from the plan.

Requirements: FR-03, FR-04, FR-08. Personas: P-01, P-02.

### Acceptance criteria

1. The overview identifies the selected budget and period; customers with multiple budgets can select which one to view.
2. Use one overview with monthly spending remaining, weekly guidance, pots grouped by type, a compact separate forecast card, and links to Edit budget and monthly history. Monthly salary, fixed-expense reserves, spending allowances and accumulated savings are clearly distinguished. Each subaccount shows its planned allocation and relevant actual movements; spending pots show their remaining amount.
3. Actual spending uses eligible booked transactions assigned to the spending pot for the selected month. Each transaction belongs to one account and at most one subaccount. Unassigned transactions remain visible for review; incomplete attribution is disclosed.
4. Virtual allocations and rollover between subaccounts do not inflate income or expenses or change the bank balance. Actual bank transfers remain distinguished from spending.
5. Spending pots that exceed their allocation plus carried-in money show the overspent amount in text as well as visual styling.
6. The overview shows remaining monthly spending and weekly allowance per spending pot. Remaining spending equals monthly allocation plus carried-in money minus actual spending in the selected month. Fixed expenses and savings are excluded. A supplementary daily guide can be shown.
7. For the current month, weekly allowance equals the positive remaining spending divided by remaining calendar days including today, multiplied by the smaller of seven and those remaining days. The daily guide uses the same division without the multiplier. Both update when spending, allocations or carried-in money change.
8. Displayed weekly and daily guides are rounded to the nearest whole DKK and labelled “About”. Use exact amounts internally. Explain that these are spending guides, not enforced limits or cash-flow forecasts.
9. With DKK 2,800 remaining on 15 October, there are 17 days left: about DKK 1,153 for seven days and DKK 165 per day. On the last day, the weekly allowance covers only that day and equals the positive remainder.
10. If the everyday-spending budget is exhausted, show DKK 0 for both weekly and daily guides; if exceeded, also show the overspent amount explicitly. Do not imply that the account balance is zero.
11. Missing required amounts produce an unavailable guide with an explanation, never a fabricated zero. Past and future months do not show a current weekly or daily allowance.

12. Pot details use one consistent layout with type-specific content: Spending shows allocation, carried-in money, actual spending, remaining allowance, recent transactions and rollover settings; Savings shows accumulated savings and allocation; Fixed expenses shows reserved money and a concise bill list. Supporting transactions/bills remain accessible within pots.
13. Allowances update when recorded transactions, accepted allocations or rollover amounts change. Display freshness/limitations rather than claiming instantaneous live banking. The current cached JSON demo refreshes only on backend restart.

Figma: [Budget prototype](https://www.figma.com/design/0ka6z9Ob7PgioGkZfnEN4V). Weekly and daily amounts are budget guidance; forecast warnings remain separately visible.

## US-07 — View an explained cash-flow forecast

As a customer, I want to see my expected end-of-month balance and its main drivers, so that I can plan my remaining spending.

Requirements: FR-05, FR-06, FR-07, FR-08. Persona: P-02.

### Acceptance criteria

1. The forecast uses balances, eligible upcoming payments and estimated variable spending for the selected budget.
2. It displays the calculation date and forecast horizon.
3. It explains expected income, upcoming expenses and estimated variable spending.
4. Show a compact overview card with accessible explanation; keep predicted balance distinct from initial AI allocation suggestions and monthly/weekly spending guidance. Do not introduce a separate mandatory insight journey.
5. Estimates are not automatically capped by planned spending limits. Show warnings only when relevant; unavailable forecast data must not erase an otherwise saved budget.
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

Status: deferred from the active simplified journey. If introduced later, insights belong within the overview or pot details, not a separate navigation flow.

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
6. The customer sees a plain-language explanation of the issue and any available corrective action. Account/profile/budget-read failures offer retry; a failed eligibility check must not imply that accounts are unused.
7. Show actual history dates and limited coverage. Do not present the supplied July–September dataset as twelve months; raw transaction counts are not unique purchase counts. The local profile is explicitly demo data, not an authenticated banking customer.
8. Preserve uncertain records for review while excluding ineligible records from calculations according to documented rules. Current read APIs can expose cancelled/unknown records; this does not mean forecast filtering/reconciliation has been implemented.

## US-11 — Choose a month-end rollover preference

As a customer, I want to save what happens to each spending pot’s leftover money, so that month-end handling follows my choice automatically.

Requirements: FR-09. Personas: P-01, P-02.

### Acceptance criteria

1. Each spending pot offers optional automatic rollover during setup. It is off until enabled; enabling it requires `TO_SAVINGS` or `TO_NEXT_MONTH`. The customer can skip setup and change or disable automation later.
2. `TO_SAVINGS` requires a selected savings subaccount within the same account. A missing or ineligible target prevents saving that preference and is explained.
3. `TO_NEXT_MONTH` adds positive leftovers to the same spending pot’s next monthly allocation; it does not replace that allocation.
4. Reopening the budget shows whether automation is enabled, the saved choice and any target. A failed save preserves input and reports the failure without implying the preference changed.
5. When automation is enabled, the preference effective at month-end is used. Changing it later does not rewrite completed rollover history.
6. With automation off and positive leftovers, the monthly summary prompts for a one-time destination and offers to enable it for future months. The user may decide later; pending money remains visible and is not silently included in savings or the next month’s spending. The summary also offers future automation settings when there is no positive remainder.

## US-12 — Review completed month-end rollover

As a customer, I want positive leftover spending money to move according to my saved preference and remain visible in history, so that I can understand my savings and next month’s allowance.

Requirements: FR-04, FR-08, FR-09, FR-10. Personas: P-01, P-02.

### Acceptance criteria

1. At month-end, positive remaining spending is allocated automatically only when enabled; otherwise it waits for the US-11 prompt decision. Zero or negative remainders produce no rollover; overspending remains visible in the closed month.
2. Each completed record preserves the closed month, amount, source and actual destination. Automatic rollover targets the next month. A deferred manual decision targets savings or spending in the then-current month, recording the destination period as well as the closed source month. Later preference changes do not alter the record.
3. Processing retries or concurrent runs cannot apply the same pot’s rollover twice. Recording the rollover and updating the virtual amounts succeed together or leave no partial movement.
4. With DKK 500 remaining and a DKK 8,000 next-month allocation, carry-forward gives DKK 8,500 before new spending. Choosing savings instead increases that savings pot by DKK 500 and leaves the spending allocation at DKK 8,000.
5. The bank balance does not change, and rollover is not reported as new salary, income or an expense. Allocations and actual spending remain distinct.
6. Closed monthly results remain available. Invalid targets or incomplete calculation inputs leave rollover unresolved with an explanation; no guessed amount or silent alternative destination is applied.

7. Monthly history is a read-only month list opening spending results and completed rollover amount/destination. A pending month-end decision is a separate actionable prompt, not an edit of completed history. Include both carry-forward and savings outcomes in the prototype.

## US-13 — Edit a saved budget

As a customer, I want to adjust my existing plan without losing my choices, so that it remains useful as my needs change.

Requirements: FR-01, FR-03, FR-09, FR-10. Personas: P-01, P-02.

### Acceptance criteria

1. Overview → Edit budget → confirm the existing account → saved widgets → Save changes. Account selection is read-only for an existing budget.
2. Load saved names, colors, ordered rows, allocations and rollover settings. Do not generate new AI suggestions or overwrite customer edits on entry.
3. Reuse US-04's inline row editing, add/remove rows, additional pots, color choices, exact totals and validation. Preserve savings unless explicitly edited or an Update savings proposal is confirmed.
4. Save changes submits the current revision and accepted plan. A successful save returns to the updated overview; a failed save preserves local inputs. A stale revision produces a conflict, never a silent overwrite; offer reloading the latest saved plan and explain that unsaved edits will be discarded before confirmation.
5. Cancel leaves the persisted budget unchanged. Over-allocation and invalid rollover destinations block saving; positive unallocated income is permitted.
6. Current-plan changes must not rewrite closed monthly history. The existing aggregate/revision API does not yet implement historical effective dates or monthly snapshots.

## US-14 — Save for an item after creation

As a customer with a saved budget, I want to review an allocation proposal for an item, so that I can decide whether to fund a named savings goal.

Status: agreed Figma demonstration extension, not implemented backend/domain behavior. Supports the allocation/explanation intent of FR-03 and FR-06; goal-specific contracts and recommendation rules require a separate decision before production implementation.

### Acceptance criteria

1. Save for an item is available only after budget creation. Collect item name, positive target amount and target date.
2. Show a clearly labelled sample proposal with current/proposed allocations and explicit Apply plan and Cancel actions. Do not imply a live AI recommendation or guaranteed target-date outcome.
3. Apply plan creates the named goal and changes only the allocations/rows shown in the accepted review, while preserving the income constraint. Opening or cancelling the proposal leaves the saved budget unchanged.
4. Keep item goals distinct from ordinary savings pots and generic monthly saving rows. Do not reintroduce a manual contribution/bank-transfer journey.
5. The AI model, funding priorities, allocation algorithm and goal persistence are deferred. Figma simulates acceptance/cancellation; current APIs do not store target amounts/dates or generate recommendations.

## Cross-cutting quality criteria

All stories are subject to NFR-02 (accessibility), NFR-05 (privacy/security) and NFR-07 (testability). Evaluate NFR-01 through US-01–05 and US-11–12, NFR-03 through recalculation flows, NFR-04 through monetary logic and NFR-06 through US-07–10. Requirement definitions are in [requirements.md](requirements.md).

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

## Current delivery evidence and remaining work

- [Backend foundation](backend-foundation-story.md): account-scoped create/update APIs, exact row totals, colors, revision conflicts and memory/PostgreSQL adapters. Income is separate from pots. This does not establish complete US-03/04/13 native flows.
- [Demo user data](demo-user-story.md): server-controlled profile and cached local source, scoped reads, safe file errors and actual coverage. No production authentication or live banking.
- [Mobile account selection](mobile-account-selection-story.md): active Create budget, profile/account/eligibility reads, masked identifiers, selection and loading/error/empty states. Continue is still disabled. This supersedes the earlier [shell-only milestone](mobile-shell-story.md), where Create budget was disabled.
- The backend stores rollover preferences only. Month closure, actual-spending attribution, accumulated/reserved balances, monthly history and rollover execution remain pending. An initial plan save is not historical accounting.
- AI suggestions, irregular-bill scheduling, native widgets/editor, forecast/warnings and goal proposals are not implemented by the current API foundation. Separate US-09 insights are deferred from the simplified active flow.
- Automated checks and native bundles are recorded in the linked delivery notes; they do not prove physical-device accessibility, usability or forecast accuracy.

## Flow alignment decisions

Stable US-01–12 identifiers are retained. US-13 makes the existing create/edit distinction explicit; US-14 records the agreed post-creation sample goal flow without claiming implemented goal contracts. The revised baseline adopts expandable spreadsheet-style widgets, initial-only AI suggestions, explicit savings-update confirmation and optional setup rollover with a month-end fallback. Weekly guidance and virtual-allocation invariants remain unchanged. No Figma, API or application code was changed by this documentation alignment.
