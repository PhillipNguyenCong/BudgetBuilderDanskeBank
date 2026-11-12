# Shared API contracts

Zod runtime schemas and inferred TypeScript types used by backend, native mobile and future web clients. This package contains no database drivers or UI framework dependencies.

Public exports cover exact integer øre, ISO dates, accounts, transactions, planned payments, quality metadata, budget plans, typed pots, editable rows, rollover settings and safe errors. Request objects are strict; derived totals and owner identity cannot be supplied by the client. Row provenance is descriptive data, not an authorization mechanism.

Build with `npm run build --workspace @budget-builder/contracts`. From the root, `npm run docs:api` generates [OpenAPI](../../docs/openapi.json) and examples; `npm run check:contracts` checks drift. Cross-field refinements (unique IDs and valid savings targets) are enforced at runtime in addition to the JSON schema. Allocation limits are authoritative budget-core/service checks.

Future AI, forecast and rollover execution contracts are intentionally not invented in this foundation.

`UserProfileSchema` and inferred `UserProfile` describe `GET /api/v1/me`: stable internal `id`, nullable nonblank `displayName`, and boolean `isDemo`. The profile contains no bank identifiers or authentication credentials. `userProfileExample` is independently authored synthetic data and is validated when generating API artifacts.

Planning rows optionally preserve `originalSuggestion` (original label and exact amount) and `adjustedByUser`. Existing rows without these fields remain valid. These fields preserve editable planning evidence across save/reopen; they do not authenticate source transactions or implement AI generation.

Fixed-expense rows optionally carry `frequency`: `MONTHLY`, `QUARTERLY`, `HALF_YEARLY` or `YEARLY`. Missing frequency means monthly. `amountOere` is the amount per payment; totals contain monthly allocations. Income, spending and savings rows reject frequency. Fixed-expense original-suggestion metadata may also preserve the original frequency. Older monthly plans remain valid without changes.

`BillSuggestionsSchema` validates on-demand account bill discovery: source date/quality, recurring or possible candidates, nullable suggested amount/frequency and evidence. Fixed-expense rows optionally retain `match.merchantKeys` separately from display labels. Their original-suggestion amount/frequency may explicitly be null when not established by the source; accepted current payment amounts remain required non-negative integers. Missing frequency still preserves older monthly-plan semantics. Classified activity optionally identifies the matched billRowId. These fields do not implement AI generation or payment execution.

Spending contracts cover source-date summaries, separate Spending and Fixed expenses totals, booked/pending/unconfirmed amounts, classified activity, correction decisions and optimistic revisions. Summary/activity carry a shared snapshotVersion; activity also identifies budgetRevision and snapshotDate. Each classified transaction declares whether it contributes as booked, pending, unconfirmed or not at all. Optional expectedSnapshotVersion prevents pagination across changing inputs. Nullable remaining/guide amounts mean unavailable, not zero. All account records can be listed independently from calculation eligibility. Transaction transferEvidence contains only a normalized evidence code; raw own/counterparty account identifiers are not exposed. Corrections use a separate versioned resource; a null decision restores automatic rules.
