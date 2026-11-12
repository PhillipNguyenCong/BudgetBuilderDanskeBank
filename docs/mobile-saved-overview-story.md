# Saved native budget overview — US-06 slice

## Acceptance criteria

1. Confirmed creation opens the new budget selected. Returning to Budget refreshes saved plans. Multiple budgets use a labelled selector with the current choice marked; an unavailable selection never silently opens another budget.
2. Show the budget name, Monthly plan, last-saved date, monthly income, allocated amount and left to allocate from saved API totals. This is a recurring plan, not a dated monthly result.
3. Show full-width colored tiles for Income, then Spending, Fixed expenses and Savings, preserving pot order within each type. Each tile names its type and saved name and shows its planned monthly amount with a details action.
4. Opening a tile shows read-only full-screen details: name, monthly amount, ordered saved rows, source explanations and adjustment labels. Empty rows and explicit zero values remain distinguishable. Fixed bills retain per-payment amounts, frequency and monthly equivalents. Spending shows the saved rollover preference and destination.
5. Opening/closing details or switching budgets performs no writes. Details close when the selected budget or loaded data changes. Close and Android Back dismiss modals, with labelled controls, modal focus and at least 44-point touch targets.
6. Loading, empty, failed reads and unavailable selections retain explicit recovery. Explain virtual pots and unavailable actual spending, balances, weekly guidance, forecasts and month-end processing without invented amounts or disabled future actions.

## Boundaries

English native UI and existing DKK formatting. No API/schema/database changes, saved-plan editing, transaction assignment, historical period selection, forecast/history/goal flows or rollover execution. This remains a partial delivery of US-06, supporting US-03 and US-10. Existing default memory storage remains temporary.

## Verification

Implemented the grouped overview, multiple-budget selector and full-screen read-only details using the existing saved budget contracts. Selection focuses the new budget heading; Close and Android Back request focus restoration to the opening control. Existing creation/navigation and synthetic API-test fixtures were updated to add bills explicitly and select pots by type rather than assume the old pot ordering. No financial behavior or API was changed by those fixture repairs.

Verification on 11 November 2026 with Node 24.22.2:

- All 15 focused overview and creation/navigation tests passed. Coverage includes selection, single-budget recovery, re-entry/cancellation, read-only detail dismissal, API totals, grouping, bill normalization, zero/empty/unavailable amounts, provenance and rollover preferences.
- Full native suite: 50 passed, 9 failed. Every remaining failure matches the previously recorded editor/creation baseline; no new failures. One old navigation failure was repaired to exercise the current Add bill → Next → OK → Done interaction. The remaining failures concern obsolete fixed-expense fixture/label assumptions in creation, allocation-guidance and widget tests.
- Synthetic mobile API create/reopen integration: passed, including exact saved-plan equality and duplicate-account rejection. Loopback binding needed sandbox permission; no shared database was used.
- Mobile TypeScript, repository formatting, documentation links and diff whitespace checks passed. Shared/backend packages built as part of the API check.
- Final iOS and Android Hermes exports passed. Expo dependency compatibility passed against the local dependency map; network version validation was unavailable in offline mode.
- Independent source review found and resolved the selector focus-restoration issue, including the single-budget recovery path. No native web detector was run.

No iOS simulator or Android emulator/tooling is installed on this host. Native screenshots, narrow/large-text layout, VoiceOver/TalkBack focus timing, Android Back behavior and physical-device accessibility remain unverified. Automated correctness, source review and native exports do not establish device accessibility, usability or forecast accuracy.

## Subsequent delivery

The [source-snapshot spending slice](mobile-spending-story.md) supersedes this slice’s modal-only pot navigation and unavailable spending notice. Pot details now use Budget-stack routes; monthly/weekly/daily guidance and transaction corrections are implemented. The acceptance criteria and counts above remain the historical evidence for this earlier delivery.
