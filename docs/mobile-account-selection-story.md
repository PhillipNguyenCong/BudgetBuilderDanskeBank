# Mobile account selection — US-03 slice

As a demo customer, I can start budget setup, see my owned accounts and choose one eligible account.

Acceptance criteria:
1. Create budget opens account selection with working back navigation and Budget still active.
2. Load the current user, accounts/coverage and saved budgets through validated existing APIs. No client owner ID is sent.
3. Show masked account identifiers, available balance (unknown stays unknown), actual coverage and data limitations. Never imply twelve months.
4. Choose one account; accounts already used by a budget are disabled with a reason. Failure to load budgets must not make all accounts appear eligible.
5. Loading, empty, all-unavailable and error/retry states are explicit. Leaving cancels requests; retry clears stale selection.
6. No budget is saved yet; the UI explains the upcoming editor and leaves Continue disabled.
7. Local iPhone networking uses an explicit LAN backend command and ignored Expo API URL. Loopback remains the backend default. No cloud deployment or login.

## Verification

Passed: 11 native tests, 34 backend/shared tests, all-workspace TypeScript checking, contract drift validation, formatting, and iOS/Android Hermes exports. Native tests cover real-route start/back navigation, selected/disabled account states, unknown balance, history coverage, loading/empty/all-used states, retries, response validation, budget-lookup failure, timeout and cancellation on unmount.

The actual mobile feature API was exercised from the development machine against the LAN backend using the ignored local Expo URL. It returned one profile, one masked account, zero used accounts and the source coverage 2026-07-01 to 2026-09-03 (two complete months). No raw profile/account data was logged. Both local servers were restarted/configured for this flow.

Physical iPhone/Android rendering and Wi-Fi reachability from the device remain unverified; a working LAN request from the Mac and successful native exports do not establish these. Test Create budget → account selection → Back in Expo Go. Budget saving, suggestions and widgets remain subsequent work. The existing dependency-audit findings are unchanged; no dependency upgrades were attempted.

Review confirmed no owner IDs or credentials are sent by the client, no API work lives in foundation, failed eligibility lookup blocks selection, and no budget mutation is performed. Local .env files are ignored.
