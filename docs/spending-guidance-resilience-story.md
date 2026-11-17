# Resilient spending guidance — US-06 / US-10

User decision, 12 November 2026: data-quality review items must not blank the spending overview. This supersedes earlier unavailable-guidance criteria for successfully calculated snapshots. An exact remainder cannot be guaranteed from incomplete records; the displayed figure is explicitly provisional when limitations remain.

## Acceptance criteria

- Every successful SpendingNumbers response contains safe numeric remaining/overspent amounts and weekly/daily guides; runtime contracts reject null or non-finite values.
- Missing amount, direction, date, attribution or coverage retains the known-movements calculation and its limitations. The main figure and affected pot cards show a provisional label; unresolved records remain reviewable and source nulls remain null.
- Known pending/unconfirmed debit commitments reduce their assigned pot only within the selected month through its cutoff. Earlier-month reservations stay in their own monthly views; undated records are separate review items. They remain separate from booked spending. Future-dated, cancelled, transferred and reconciled-away movements do not count.
- Pending records use bookedOn, then valueDate, then valid authorisedOn with an explicit AUTHORISED_ON basis. Authorisation timestamps use existing Copenhagen date conversion and never become booking dates. Booked records do not use this pending-only fallback.
- Exact øre arithmetic, Spending/Fixed expenses separation, corrections, reconciliation and source-snapshot dates remain intact. Network failures and invalid plans retain explicit errors; no account balance, invented amount or hidden zero fallback is substituted.

## Verification

Synthetic regression cases cover missing essentials and coverage, undated/prior-month/future/cancelled/transfer commitments, duplicate holds, authorisation date precedence, unknown source amounts and the non-null runtime response guard. Native tests check the provisional amount and visible warning. The supplied file is checked only locally against an example plan, never committed or uploaded. No forecast-accuracy or usability result is claimed.

Verified: 74 backend/shared/contract tests and 78 native tests passed; all-workspace TypeScript, formatting, generated OpenAPI drift checks and iOS/Android Hermes exports passed. HTTP tests required loopback permission for isolated synthetic test servers. A local read-only check against the supplied file returned numeric remainder and guides with explicit provisional limitations using the example plan; this is not verification of a customer's saved allocation amounts. Native device visual/accessibility checks remain pending. No source file changes, database migrations or deployment were performed.

The [monthly summary decision](monthly-budget-views-story.md) supersedes the original cross-month outstanding-hold rule. Numeric guidance with explicit uncertainty remains in place.
