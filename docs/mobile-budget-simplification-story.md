# Simplify mobile budget screens — US-02 / US-04 / US-06 / US-10

As a customer, I can find my budget amounts and next action quickly, and open supporting explanations when needed. Supports NFR-02; this delivery does not establish measured usability improvements.

## Acceptance criteria

1. Creation and offline preview offer no Add a pot section, type buttons or replacement menu. Initial widgets, imported multiple-pot plans, bill rows and saved budgets remain supported.
2. Following the subsequent user correction, the editor shows the same global allocation guide beneath each widget amount, with a short provisional label for incomplete amounts and local missing-input/validation messages. The separate top card is removed. The fixed-expense overlay retains guidance during bill entry.
3. Monthly plan totals start collapsed in creation, preview and saved overview. Savings review, validation and submit controls remain available without expanding totals.
4. Saved overview leads with budget/account identity, demo date and spending guidance. Pot cards show name, amount, its meaning, review/overspending warnings and details navigation. Existing details retain booked/pending/unconfirmed breakdowns and payment frequencies.
5. Each budget screen has at most one Read more information entry. Source coverage, default attribution, calculation semantics and prototype limitations are disclosed there. Secondary suggestion metadata uses an inline disclosure inside the bill editor.
6. Actionable uncertainty, over-allocation, overspending, loading, empty, failed-request and save-recovery states remain visible. Unavailable amounts never become zero.
7. Read more opens a scrollable native information overlay with an accessible heading, Close, platform-back dismissal and focus restoration. Closing help or totals does not reset drafts or navigation.
8. Financial algorithms, API contracts, persistence, colours, typography and navigation remain unchanged.

## Verification

Component and navigation tests cover disclosure, retained inputs, removed add-pot controls, single allocation guidance, creation/save recovery and activity navigation. Run mobile tests, mobile TypeScript, formatting, Expo dependency checking and iOS/Android exports. Native device checks remain pending because this host has no simctl tooling. Automated checks do not establish physical-device accessibility, usability or forecast accuracy.

Verified on 12 November 2026: all 78 mobile tests across 20 suites passed, mobile TypeScript passed, repository formatting and diff whitespace checks passed, and affected relative documentation links resolved. A static check confirmed foundation components do not import features; existing cross-feature boundaries remain unchanged. Final iOS and Android Hermes exports passed. Expo dependency checking passed against its offline map and explicitly warned that offline validation is unreliable; no online compatibility result is claimed. No database operation, deployment or backend/contract change was performed.
