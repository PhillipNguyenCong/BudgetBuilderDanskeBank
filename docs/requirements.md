# Requirements

Status: proposed MVP baseline. Requirements describe intended behaviour, not completed functionality. See [user stories](user-stories.md) for acceptance criteria and [delivery plan](delivery-plan.md) for evaluation.

## Functional requirements

| ID | Requirement |
| --- | --- |
| FR-01 | The system shall allow customers to create multiple separate budgets, each using exactly one account owned by that customer. An account may belong to at most one budget at a time. |
| FR-02 | The system shall suggest budget items and transaction categories from available banking data and allow customer corrections. |
| FR-03 | The system shall record monthly take-home salary and divide the account into named virtual subaccounts, each of exactly one type: savings, spending or fixed expense. The customer sets non-negative monthly allocations whose total cannot exceed salary. Savings accumulate; fixed-expense allocations reserve money for bills. |
| FR-04 | The system shall display planned and actual amounts for a selected budget period and subaccount, including remaining monthly spending and a weekly allowance. Remaining spending includes money carried in from the previous month. A daily guide may supplement the weekly allowance; neither is a cash-flow forecast. |
| FR-05 | The system shall estimate the end-of-month balance and identify the first projected negative-balance date when sufficient data is available. |
| FR-06 | The system shall explain forecasts, spending changes and warnings using relevant amounts, categories, assumptions and dates. |
| FR-07 | The system shall identify missing, conflicting or uncertain data and explain its effect on calculations. |
| FR-08 | The system shall avoid counting the same cash movement more than once and distinguish internal transfers from income and expenses. |
| FR-09 | The system shall save an editable rollover preference for each spending subaccount: move positive month-end leftovers to a selected savings subaccount in the same account, or add them to the same spending subaccount’s next monthly allocation. |
| FR-10 | The system shall record each completed rollover’s month, amount, source and actual destination, process it at most once per spending subaccount and month, and preserve monthly results and past rollover records when preferences change. Zero or negative leftovers do not roll over. |

## Non-functional requirements

The numerical targets below are proposals to agree before evaluation. Results must include the dataset, environment, procedure and limitations; they must not be claimed in advance.

| ID | Requirement and evaluation |
| --- | --- |
| NFR-01 — Usability | At least four out of five representative test participants should complete budget creation without moderator assistance. Record completion time, errors and misunderstandings. This small formative sample does not establish population-wide usability. |
| NFR-02 — Accessibility | Core budget flows shall support keyboard navigation, labelled inputs and text-based warnings. Colour shall not be the sole means of conveying meaning. Verify the complete flow manually and supplement with automated checks. |
| NFR-03 — Performance | Budget recalculation should complete within one second with the agreed demo dataset in a documented test environment. Measure from a confirmed input change to the updated result; document dataset size and repeat-run timings. |
| NFR-04 — Calculation reliability | Monetary calculations shall use integer oere or equivalent exact decimal arithmetic. Identical inputs and calculation dates shall produce identical baseline results. Verify rounding and reproducibility with unit tests. |
| NFR-05 — Privacy and security | The prototype shall use synthetic or approved anonymised data. Credentials and raw financial records shall not appear in source control or diagnostic logs. Review fixtures, logs and repository changes before publishing them. |
| NFR-06 — Transparency | Each forecast shall identify its calculation date, data period and material assumptions. Insufficient data shall produce an explicit limitation instead of an apparently reliable estimate. Verify both complete and incomplete input cases. |
| NFR-07 — Testability | Normalisation, categorisation, reconciliation and forecasting shall be independently testable. Integration tests shall verify how their outputs are combined. |

## Scope boundaries

The initial prototype does not execute payments, access live accounts or implement production banking authentication. A trained machine-learning model is not assumed to exist. Joint ownership, split transactions and historical account reassignment are outside the first design. A Budget Health Score is a possible extension, subject to a defined calculation, explanation and usability evaluation.

Savings allocations and rollover are virtual planning movements within the account, not expenses, income or bank payments. They do not change its balance. A real transfer outside that account affects its balance but remains classified as a transfer; its treatment in displayed totals must be specified before implementation.

A transaction belongs to one account and may be assigned to at most one subaccount, or remain unassigned. Unassigned spending and uncertain data must remain visible rather than silently disappearing from the budget. Detailed categories and bill schedules remain supporting scope even though they are omitted from the simplified [domain model](../domain-model-notes.md).

## Design alignment — 5 November 2026

The domain model is the conceptual baseline for this revision. FR-01 now requires exactly one account per budget; FR-03 and FR-04 explicitly cover virtual subaccounts and spending allowances; FR-09 and FR-10 add rollover. Existing requirement IDs are preserved. These describe intended behaviour, not implemented functionality.
