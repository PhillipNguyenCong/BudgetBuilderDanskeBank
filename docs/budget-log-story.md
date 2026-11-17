# Active-month Budget log — US-06 / US-10 / US-12 partial

User decision, 12 November 2026: a budget starts in its actual creation month. Replace the source-history slider with Budget log, showing active months vertically and opening the selected month's overview. The user explicitly chose actual November creation, not September demo-source activation.

## Acceptance criteria

1. Derive startMonth from immutable, trusted createdAt in Europe/Copenhagen. Include the complete creation calendar month; do not prorate it or let imported history/client month parameters backdate activation.
2. Derive currentMonth from the injected server clock. Available months are contiguous from creation through current month. Reject before-start and future summary/activity/classification period requests. Existing budgets use their saved creation timestamps; plan updates do not reset activation.
3. Keep sourceSnapshotDate separate from the active calendar. Months lacking source coverage remain active but explicitly provisional, with missing-source warnings and unchanged unknown records. Do not manufacture transactions or silently rewrite the demonstration data to populate November.
4. Replace Previous/Next with one Budget log entry in the overview. The log opens as a Budget-stack child route with a vertical newest-first list, current-month/data-availability labels, loading/error/retry and accessible month buttons. Only active months appear; client filtering also rejects old imported months from inconsistent log metadata.
5. Tapping a month opens that budget's overview and retains period context through pot details, activity, classification recovery and Back. Selecting another budget resets the period. Before-start deep links cannot expose a spurious monthly summary.
6. Existing exact allocation − booked − pending − unconfirmed calculation remains intact. August's roughly DKK −1.245 million result came from applying a plan to older imported activity, including a literal DKK 1,250,000 synthetic debit labelled Intern postering. The value is not silently rescaled or declared an internal transfer on its description alone. August is unavailable for a November-created budget.
7. No database migration is required: existing creation metadata is authoritative. No source records, production/shared database or deployment are changed. The log still reconstructs active historical months with the current plan; immutable closed results and effective-dated historical plans remain future work.

## Verification

Synthetic backend coverage includes November creation with September-only source data, before-start/future rejection, current-month activity isolation, month progression into January, stable creation metadata, Copenhagen/UTC month boundaries, plus existing pending/booking/release cases. Native tests cover vertical ordering, active-month filtering, month navigation and log request recovery.

Verified: 85 backend/shared/contract tests, 95 native tests across 22 suites and one mobile API integration test passed. TypeScript, formatting, OpenAPI drift and iOS/Android Hermes exports passed. HTTP tests used isolated synthetic loopback servers. iPhone 17e / iOS 27.2 simulator verification opened Budget log, showed only November 2026 with Active since November 2026, and opened November's overview. The overview visibly warned that source data ends 3 September. Before-start August reads returned HTTP 400. The supplied demo file was read locally and unchanged; physical-device, VoiceOver and representative-data accuracy are not established by these checks.
