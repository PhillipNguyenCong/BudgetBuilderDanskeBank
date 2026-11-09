# Manual native budget creation — US-03 / US-04 slice

Decision: implement manual creation first, then add initial AI suggestions to the same editable draft. This staged delivery does not replace US-04's suggestion criteria or claim that they are complete.

## Acceptance criteria

1. Continue on account selection requires one eligible account and opens manual setup. Reload ownership/eligibility before editing; an unknown, foreign or already-used account cannot start a new plan.
2. Show the selected masked account and actual source coverage. Explain that this is manual entry and no amounts have been generated. Start four widgets with blank amounts, not sample values or implied zero. Require a name and explicit income/allocation inputs; keep validation and savings review from the editor slice.
3. Each spending pot offers optional rollover settings, initially off. Validate a destination and same-budget savings target before submission; disclose that month-end execution is not yet implemented.
4. Create budget submits only accountId and the validated accepted plan. No write occurs on opening, editing or cancelling. Prevent repeat taps and editing during a pending save; preserve the draft on failure. The backend remains authoritative for ownership, totals and atomic exclusivity.
5. A timeout or malformed success response may mean creation succeeded. Preserve inputs and offer a read-only saved-budget check, never silently switch accounts or resubmit automatically. An account conflict is explained and offers the existing budget for review.
6. After a confirmed save, return to Budget with the new plan selected. List/reopen separate saved budgets, with names, rows, colors, allocations and rollover choices intact. Loading/error is never treated as an empty collection. Clearly distinguish saved planned amounts from unavailable actual balances/allowances/forecasts.
7. Back/cancel confirms discarding edited setup; pending requests and successful navigation are handled without a false discard prompt. Reopening Budget refreshes its server data.
8. Persist original suggested label/amount and explicit adjustment state when present, without altering old plans. This prepares the editor for later AI input; no AI service is invoked here.

## Boundaries

Uses the existing API and configured storage. Default memory storage retains budgets only until backend restart. No database provisioning/migration, deployment, dataset upload or changes to credentials. Saved-budget editing (US-13), actual-spending/forecast overview, bill schedules and rollover execution remain subsequent slices.

## Verification

Passed: 32 native tests, 36 backend/shared tests and one mobile-feature-API integration test. Native coverage includes account selection → blank manual entry → create → saved overview, direct-entry discard confirmation, pending-save protection, failed-save retention, rollover validation, uncertain-outcome recovery, returning-user routing and retained suggestion provenance. The integration test uses the actual mobile API modules against an isolated synthetic HTTP server, then reopens the exact saved plan and verifies duplicate-account rejection. It does not touch the configured local dataset or shared database.

All-workspace TypeScript, formatting, generated-contract drift, relative documentation links and `git diff --check` passed. Final iOS and Android Hermes exports passed. Checks use the existing Node 24.22.2 runtime because the host default Node 24.2.0 is below the supported native tooling range. HTTP tests require permission to bind ephemeral loopback ports. Physical-device accessibility, keyboard, screen-reader focus and visual checks remain pending.

To try the flow, restart an already-running backend and Metro so both load the updated shared contracts. Use the existing LAN configuration in the mobile README. Default memory-mode budgets survive navigation/app reloads while the server runs, but reset when that server restarts. AI, saved-budget editing, real forecast/actual-spending calculations and month-end execution are not claimed by this delivery.
