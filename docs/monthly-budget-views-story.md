# Monthly budget views — US-06 / US-10 / US-12 partial

User decision, 12 November 2026: each month has its own budget overview. An August pending item belongs to August, not September's allowance. A later actual booking counts once in its booked month, with its earlier reservation linked when the source supports that relation.

## Acceptance criteria

1. Booked, pending and unconfirmed amounts enter only their transaction's calendar month through that view's cutoff. An explicit pending authorisation date can identify its month without becoming a booking date. No prior-month or undated commitments are silently carried into a current allowance.
2. Undated records remain available through a separate paginated review view, retain unknown dates/amounts, and never receive an invented month. Uncertainty can still make numeric monthly guidance provisional.
3. Stable source versions with matching amount/direction/text/counterparty and a dated pending-to-booked/released transition resolve once. The earlier reservation says Booked in/Released in the later month. Unmatched/conflicting versions and earlier customer corrections require review rather than guessed merchant/date matching.
4. Spending summary and classification reads accept validated optional month=YYYY-MM. Only active months from actual Copenhagen creation through the current server-calendar month are selectable. Summaries expose active availableMonths, startMonth, currentMonth, sourceSnapshotDate and undatedReviewCount; selected month participates in snapshot versioning and activity validation.
5. Mobile overview opens a Budget log with active months listed vertically, newest first. Pot details, account activity, correction recovery and Back retain the period; selecting another budget resets to its current active month. Late responses cannot replace a newly selected month's data. Invalid/unavailable periods have explicit recovery.
6. Historical views show their period, signed remainder and Historical view · Current plan applied. Current-week/day guides are hidden for past months. They apply the current plan and latest corrections/source versions with zero configured carry-in, not immutable closed results or historically effective plans.
7. No payment execution, month closure, rollover, database migration or deployment is introduced. Closed-result preservation and completed rollover history remain unimplemented US-12 criteria. Imported demonstration records are unchanged and are not committed/uploaded.

## Verification

Synthetic tests cover period-isolated pending bills, dated authorisation fallback, late booking/release, stable identity versus source conflicts, preserved correction review, undated review, invalid/out-of-coverage months, period-specific snapshot versions and native month navigation. Native simulator verification uses the existing isolated memory backend and approved local demonstration source; automated tests use independent fixtures.

Verified on 12 November 2026: 83 backend/shared/contract tests, 94 native tests across 22 suites and one mobile feature API integration test passed. All-workspace TypeScript, formatting, generated OpenAPI drift, affected documentation links, foundation dependency boundaries and diff whitespace checks passed; final iOS and Android Hermes exports passed. HTTP tests used isolated synthetic loopback servers.

Native simulator evidence: iPhone 17e / iOS 27.2 using Expo Go, the Xcode plugin and Device Hub accessibility. Previous opened August, pot details showed only August's bill movements, Back retained August, and Next restored September and current weekly/daily guidance. With the checked DKK 9,253 demonstration bill plan, September contained only its DKK 8,500 pending rent and displayed DKK 753 remaining; August's DKK 8,500 pending rent and July's DKK 624 pending insurance no longer reduced September. The supplied demo source was read locally and unchanged. A disposable memory budget on the separate simulator backend was used; backend rebuilds may clear it. Physical-device, VoiceOver, representative-data accuracy and immutable historical accounting are not established by these checks.

The later [Budget log decision](budget-log-story.md) supersedes source-coverage-based history and the Previous/Next UI. Earlier simulator evidence below describes the preceding version; current budgets cannot open a month before their creation, even when source data exists for that month.
