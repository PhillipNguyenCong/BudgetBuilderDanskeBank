# Delivery and evaluation plan

Status: proposed plan, not a record of completed work.

## Delivery order

| Stage | Stories | Intended outcome |
| --- | --- | --- |
| 1. Budget setup and data foundation | US-01, US-02, planning portion of US-03, US-08 | Create separate budgets, review suggestions and expose input problems. |
| 2. Actual spending | US-04 | Compare planned and actual spending with transfer and duplicate handling. |
| 3. Forecasting and warnings | US-06, US-07, forecast portion of US-03 | Explain a baseline forecast and identify daily shortfalls, including irregular bills. |
| 4. Spending insights | US-05 | Explain category changes using defensible comparison periods. |

US-03 and US-08 span stages. Do not mark a story complete until all of its acceptance criteria pass. A Budget Health Score is deferred until its meaning, calculation and usefulness are validated.

## Test and evaluation plan

- Unit tests: exact monetary calculations, recurring-payment dates, normalisation, category overrides, duplicate handling, transfers, cancelled payments and daily balance calculations.
- Integration tests: account selection through budget persistence; normalised records through categorisation, reconciliation and forecast generation; behaviour when a stage returns incomplete data or fails.
- Usability evaluation: representative participants complete budget setup, interpret a forecast, explain a shortfall warning and identify a data-quality limitation. Capture task outcomes and misunderstandings using the proposed NFR targets.
- Forecast evaluation: compare predictions with later observed outcomes at historical cutoffs. Prevent future information from entering model inputs. Compare any later model with the transparent baseline using the same periods and inputs.
- Security and privacy review: inspect fixture provenance, logs, credentials, persistence and data exposure. Production banking security is outside the prototype scope and must not be implied by passing these checks.

Successful unit tests demonstrate specified behaviour, not predictive accuracy or usability. If historical coverage is insufficient, report that limitation and use synthetic scenarios for correctness checks rather than claiming measured forecast accuracy.

## Design documentation to add

- Architecture diagram: user interface, application services, calculation modules and storage boundaries.
- Data-flow diagram: demo source data through normalisation, categorisation, reconciliation and forecasts to user-visible explanations.
- Forecasting specification: balance basis, assumptions, variable-spending estimate, historical cutoff, minimum coverage and uncertainty handling.
- Security/privacy and data-quality notes with explicit decisions and limitations.
- Repository-specific AGENTS.md once the implementation layout, commands and review workflow are agreed.

Existing local diagrams and the budget-core experiment are separate artifacts. Their migration into this fresh repository requires checking that they match these requirements; this documentation commit does not imply they have been migrated.

## Open decisions

1. Validate personas and confirm usability tasks and measurable quality targets with the supervisor.
2. Define a significant spending change and the comparison window for US-05.
3. Confirm the balance basis, payment-direction interpretation, historical coverage and duplicate matching for US-06/US-08.
4. Define how refunds, transfers outside a budget and savings allocations affect each displayed total.
5. Define persistence and edit behaviour before implementing the save/reopen stories.
6. Choose the implementation structure and record it before creating agent instructions tied to paths or commands.

## Traceability and completion

Use stable IDs in issues, tests and pull requests, for example `US-06 AC-2` and `NFR-06`. For each completed story, record the implementation link, tests run, unresolved limitations and any usability evidence. Changes to acceptance criteria should be documented as decisions, not silently rewritten to match the implementation.
