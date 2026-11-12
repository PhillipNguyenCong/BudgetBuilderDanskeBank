# Source-snapshot spending — US-06

## Acceptance criteria

1. Creation opens the selected overview, led by monthly spending remaining, next-seven-days and daily guidance. Account identity and the source snapshot date remain explicit. The current plan is applied to that demonstration month, with an explicitly configured zero opening carry-in; no historical results or executed rollover are implied.
2. Every linked-account transaction is accessible automatically. Eligible booked debits match unique whole phrases in fixed-expense bill labels or spending names/rows; unmatched debits use the first spending pot, disclosed as the default. Ambiguous, invalid and conflicting records remain visible. Explicit source evidence identifies internal transfers.
3. Actual spending contains booked movements only. Known pending debits and known debits with unknown booking status are shown separately as pending/unconfirmed commitments and reduce the relevant pot immediately. Planned payments, transfers and virtual allocations do not contribute. Credits remain separate unless explicitly corrected to a Spending or Fixed expenses refund. No manual assignment is required to begin viewing activity.
4. Remaining equals allocation plus carried-in money minus booked, pending and unconfirmed movements. Weekly guidance uses positive remaining / remaining calendar days including the snapshot day × min(7, remaining days). Daily guidance omits the multiplier. Display About and nearest whole DKK; preserve exact integer-øre calculations and signed overspending internally.
5. Each Spending pot and the combined signed remainder have independent guidance. Fixed expenses has separate allocation/booked/pending/unconfirmed/remaining totals and never enters the Spending guide. Savings is excluded. Missing essential inputs or incomplete coverage make affected guides unavailable, with known movements still visible and explained.
6. Budget-stack pot routes retain the bank header and tab bar. Back preserves budget selection and overview position. Pot details show the breakdown, recent transactions and saved rollover preference; all-account activity remains accessible.
7. Optional corrections change expense attribution, mark transfers or confirm refunds. Store corrections separately with ownership and optimistic concurrency checks. Identical re-imports retain them; changed/removed source records never erase prior corrections. Failed or uncertain writes preserve choices and require reloading before retry.
8. Saved plans remain available on spending-read failure. Refresh activity after corrections and re-entry, cancel abandoned requests, and never mix spending results with a different budget revision.

## Boundaries and decisions

Rules-based attribution is explainable and correctable, not AI or a claim of validated categorization accuracy. Internal-transfer evidence uses an explicit INTERNAL_TRANSFER source channel or matching own/counterparty account identifiers, without exposing identifiers. Other payment rails and free text are not proof of a transfer. Expense and refund targets are Spending/Fixed expenses pots. Refunds restore the chosen pot; other credits do not offset it.

The snapshot uses the source's Copenhagen calendar date, bounded by its declared coverage end, not a hardcoded September date. The supplied source therefore opens on 3 September 2026. Weekly/daily amounts describe that snapshot; the UI never presents it as today's live bank data. No historical month selection, forecast, balance accumulation, budget editing, month closure or rollover execution is included.

PostgreSQL correction storage receives an additive migration generated locally; application is an independent explicit action. Default memory mode remains temporary. Financial algorithms stay in budget-core, HTTP validation in contracts/routes, orchestration in services/hooks and persistence in repositories.

## Verification history

The original source-snapshot slice was verified on 11 November 2026 with Node 24.22.2. The later live-budget helper verification is reported in [its focused delivery record](mobile-live-budget-story.md); counts below describe the earlier slice and are retained as historical evidence:

- Backend/shared: all 58 tests passed. New coverage includes exact rational rounding, the agreed DKK 2,800/17-day example, final-day/leap-year dates, overspending, overflow, combined signed remainders, automatic attribution, partial coverage, uncertain records, source collisions, transfers, refunds, ownership, re-import preservation and correction conflicts.
- All 21 focused native overview/activity/correction/navigation tests passed. Full native suite: 56 passed, 9 failed; every remaining failure matches the recorded editor/creation baseline. No new failures. New tests cover source-snapshot guidance, independent spending errors, routed pot details with the Budget tab retained, explicit correction acceptance, pending-write protection, uncertain/stale-write recovery, coordinated refresh, pagination restart and snapshot mismatches.
- The actual mobile API integration passed against an isolated synthetic loopback backend: create/reopen, read guidance, change attribution to produce overspending, then restore automatic assignment without changing the saved budget. Loopback tests needed sandbox permission; no configured dataset or shared database was used.
- All-workspace TypeScript, shared/backend builds, formatting, generated API contract drift, documentation relative links and diff whitespace checks passed.
- Final iOS and Android Hermes exports passed. No dependencies were added.
- Independent source review found three consistency defects and scored all resolved after correction: resetting paginated activity on re-entry, matching summary/activity snapshots, and guarding the budget revision atomically with correction persistence. Tests include a service-to-commit plan-change interleaving; PostgreSQL query shape/parameters are tested with a fake runner, not a live database.

Summary and activity responses share a version derived from the plan, source data/coverage and correction revisions. An expectedSnapshotVersion mismatch returns 409 and the native view offers coordinated refresh. Earlier pages and query scopes are cleared on re-entry or changed inputs. Corrections guard both plan and correction revisions; the generated migration has not been applied. Memory persistence remains temporary.

The Figma flow was reviewed for inspiration through the current file’s newer simple overview/spending screens and archived purchase/overspending scenarios. The connector did not verify the URL’s pinned historical revision. The app retains its existing native tokens rather than replacing them with the older Figma cosmetics.

No iOS simulator or Android emulator/ADB is installed on this host. Native screenshots, scroll-position/focus timing, largest-text layout, VoiceOver/TalkBack, gestures and physical-device behavior remain unverified. No web detector was run for native code. Source review, automated correctness checks and exports do not establish native usability, accessibility, live PostgreSQL concurrency or forecast accuracy.
