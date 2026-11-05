# Delivery and evaluation plan

Status: proposed plan, not a record of completed work.

## Delivery order

| Stage | Stories | Intended outcome |
| --- | --- | --- |
| 1. Budget setup and data foundation | US-01, US-02, US-03, US-04, US-11, planning portion of US-05, US-10 | Select one account, configure typed virtual pots and salary allocations, save rollover choices and expose input problems. |
| 2. Actual spending and monthly continuity | US-06, US-12 | Show remaining monthly/weekly spending and supplementary daily guidance; preserve history and apply rollover exactly once with transfer and duplicate handling. |
| 3. Forecasting and warnings | US-07, US-08, forecast portion of US-05 | Explain a baseline forecast and identify daily shortfalls, including irregular bills. |
| 4. Spending insights | US-09 | Explain category changes using defensible comparison periods. |

US-05 and US-10 span stages. Do not mark a story complete until all of its acceptance criteria pass. A Budget Health Score is deferred until its meaning, calculation and usefulness are validated.

## Test and evaluation plan

- Unit tests: exact monetary calculations, salary over-allocation, carried-in amounts, weekly allowances in short/final weeks, zero/negative leftovers, both rollover destinations, recurring-payment dates, normalisation, category overrides, duplicates, transfers, cancelled payments and daily forecast balances.
- Integration tests: exactly-one-account selection through budget persistence; saved rollover preferences and eligible savings targets; concurrent/retried month closure without duplicate or partial movement; preserved history after preference changes; normalised records through assignment, reconciliation and forecasting; incomplete-input and failure states.
- Usability evaluation: representative participants divide salary into virtual pots, interpret monthly/weekly allowances, choose a rollover destination, explain the next month’s carried-in amount, interpret a forecast, explain a shortfall warning and identify a data-quality limitation. Capture task outcomes and misunderstandings using the proposed NFR targets.
- Forecast evaluation: compare predictions with later observed outcomes at historical cutoffs. Prevent future information from entering model inputs. Compare any later model with the transparent baseline using the same periods and inputs.
- Security and privacy review: inspect fixture provenance, logs, credentials, persistence and data exposure. Production banking security is outside the prototype scope and must not be implied by passing these checks.

Successful unit tests demonstrate specified behaviour, not predictive accuracy or usability. If historical coverage is insufficient, report that limitation and use synthetic scenarios for correctness checks rather than claiming measured forecast accuracy.

## Design documentation to add

- Architecture diagram: user interface, application services, calculation modules and storage boundaries.
- Data-flow diagram: demo source data through normalisation, categorisation, reconciliation and forecasts to user-visible explanations.
- Forecasting specification: balance basis, assumptions, variable-spending estimate, historical cutoff, minimum coverage and uncertainty handling.
- Security/privacy and data-quality notes with explicit decisions and limitations.
- Month-close specification: calendar/timezone cutoff, execution trigger, retries, late transactions, corrections and history preservation.

The [domain model](../domain-model-notes.md), [Mermaid source](../domain-model.mmd) and [rendered image](../domain-model.png) are published and aligned with this planning baseline. The diagram deliberately omits supporting bill/category details and technical metadata. It is not an implemented schema. The local budget-core experiment remains separate and must be reviewed before migration.

## Open decisions

1. Validate personas and confirm usability tasks and measurable quality targets with the supervisor.
2. Define a significant spending change and the comparison window for US-09.
3. Confirm the balance basis, payment-direction interpretation, historical coverage and duplicate matching for US-07/US-10.
4. Define how refunds, transfers outside a budget and savings allocations affect each displayed total.
5. Define effective dates for allocation edits, fixed-expense reserve updates and historical corrections before implementing persistence.
6. Specify month-close timezone/cutoff, trigger/retries and handling of late transactions for US-12. Invalid inputs must not produce a fabricated rollover.

## Traceability and completion

Use stable IDs in issues, tests and pull requests, for example `US-07 AC-2` and `NFR-06`. For each completed story, record the implementation link, tests run, unresolved limitations and any usability evidence. Changes to acceptance criteria should be documented as decisions, not silently rewritten to match the implementation.
