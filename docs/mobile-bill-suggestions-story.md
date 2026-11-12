# On-demand bill discovery — US-04 / US-05

## Acceptance criteria

1. Account selection and opening manual setup do not request bill suggestions. The first opening of Add bills in account-backed creation opens the editor immediately and starts an owned-account read. Offline sample preview and saved budgets do not generate suggestions.
2. Show Looking for bills while the request runs. Manual entry and closing remain available. Eligible recurring patterns produce labelled, editable suggestion rows only while the originally opened bill editor is still empty and open. No other widget or savings allocation changes.
3. If the user adds a row, closes the editor or starts saving before the response arrives, cache the results and offer them separately. Never overwrite manual entries, add hidden allocations or auto-apply after a retry/refresh. Add found bills explicitly merges remaining suggestions without duplicates.
4. Cache results and failure state for the selected account's creation draft. Reopening does not refetch or reinsert removed bills. Explicit retry/refresh preserves edits and removals. Leaving creation aborts requests; changing account starts an independent draft.
5. Recognize confirmed recurring payments using booked DKK debits, normalized merchant/payee keys, dates and amount consistency. Known pending evidence may produce a Possible suggestion but cannot confirm recurrence. Exclude transfers, unknown/colliding source records and cancelled payments. Explain evidence, actual coverage and uncertainty. A single recurring planned payment is a possible bill, not proof of monthly frequency.
6. Stable known Rent/Husleje and Netflix aliases can support a two-payment recurring pattern; unknown payees require at least three consistent payments for automatic insertion. Less certain candidates remain separate and require explicit addition/review. Unknown payment amounts remain blank, not zero; uncertain frequency is explicitly disclosed.
7. Preserve suggested amount/frequency, source explanation and original suggestion metadata. Save matching keys separately from editable labels so renaming Rent to Husleje does not break future attribution. Suggestions remain a draft until Create budget succeeds.
8. Loading, no results and failures have explicit copy and recovery. Failure does not block manual budget creation. Suggestions and accepted rows remain distinguishable from actual cash movements; monthly equivalents use existing budget-core calculations.

## Boundaries

This is a deterministic bill-discovery slice, not full AI budget generation or a forecast. It supersedes blank/manual-only behavior for supported fixed-expense suggestions, without changing blank income/spending/savings inputs. No source data repair, deployment, cloud upload, database migration application or payment execution. Existing missing-booking-status records remain uncertain independently of bill discovery.

The later [live-budget helper](mobile-live-budget-story.md) extends pending evidence for known bills and keeps it explicitly Possible; the verification counts below describe the original slice.

## Verification

Verified on 11 November 2026 using Node 24.22.2:

- `npm test`: 65 backend/shared tests passed, compared with 58 before this slice. Synthetic cases cover recurring Rent/Netflix, unknown/pending/transferred/conflicting records, unfamiliar merchants, distinct named payees with generic descriptions, ownership, read-only discovery, save/reopen and subsequent renamed-bill attribution. Manual Husleje/Netflix aliases and conflicting-payee fallback to Spending are covered end to end.
- Mobile tests: 66 passed and 9 failed, compared with the recorded 56 passed/9 failed baseline. The same nine test names failed; there are no new failures. Existing failures are in CreateBudgetScreen (4), AllocationGuidance (3) and BudgetWidget (2), caused by obsolete assumptions about an initial fixed-expense row. All ten added tests passed: lazy fetching, editable automatic insertion, rename provenance, manual/close races, cache reuse, refresh/removal preservation, retry/empty states, cancellation, unknown amount/frequency review, identity deduplication and manual Husleje deduplication.
- `npm run test:mobile:api`: passed against an isolated synthetic HTTP server. The actual mobile API reads suggestions without creating a budget, then creates/reopens a plan, reads guidance/activity and applies/resets a correction. No configured/shared database was used.
- `npm run typecheck`, `npm run format:check`, `npm run check:contracts`, `git diff --check`, iOS export and Android export passed. API artifacts were intentionally regenerated. `npm run check:mobile` passed using Expo's local dependency map; network version validation was unavailable in offline mode.
- A read-only check of the running local demo endpoint returned HTTP 200, source date 3 September 2026, zero automatic recurring suggestions and one possible bill. Limited/uncertain source evidence therefore produces reviewable candidates rather than invented recurrence. No imported records were modified. The separate unknown-booking-status limitation can still make spending guidance unavailable.
- Independent finish review resolved the distinct-payee matching/dismissal and unknown-source-provenance findings. A final targeted review verified manual aliases and the protected identity fallback. Source documentation review confirmed use of existing typography, spacing, controls and modal patterns; no new visual assets or design tokens were introduced.

Native layout, narrow screens, large text, keyboard behavior, modal focus/return focus, 44-point touch targets and VoiceOver/TalkBack were not verified on devices. The environment has no usable iOS simulator (`xcrun simctl` unavailable) or Android adb/emulator. Source labels and existing control minimum sizes were inspected; that is not device accessibility approval. Native exports and automated correctness checks do not establish usability, detection accuracy on representative banking data or accessibility. Live PostgreSQL integration and forecast evaluation were not run; this slice adds no migration and applies none.
