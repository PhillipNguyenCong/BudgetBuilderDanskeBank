# Shared API contracts

Zod runtime schemas and inferred TypeScript types used by backend, web and future mobile clients. This package contains no database drivers or UI framework dependencies.

Public exports cover exact integer øre, ISO dates, accounts, transactions, planned payments, quality metadata, budget plans, typed pots, editable rows, rollover settings and safe errors. Request objects are strict; derived totals and owner identity cannot be supplied by the client. Row provenance is descriptive data, not an authorization mechanism.

Build with `npm run build --workspace @budget-builder/contracts`. From the root, `npm run docs:api` generates [OpenAPI](../../docs/openapi.json) and examples; `npm run check:contracts` checks drift. Cross-field refinements (unique IDs and valid savings targets) are enforced at runtime in addition to the JSON schema. Allocation limits are authoritative budget-core/service checks.

Future AI, forecast and rollover execution contracts are intentionally not invented in this foundation.

`UserProfileSchema` and inferred `UserProfile` describe `GET /api/v1/me`: stable internal `id`, nullable nonblank `displayName`, and boolean `isDemo`. The profile contains no bank identifiers or authentication credentials. `userProfileExample` is independently authored synthetic data and is validated when generating API artifacts.

Planning rows optionally preserve `originalSuggestion` (original label and exact amount) and `adjustedByUser`. Existing rows without these fields remain valid. These fields preserve editable planning evidence across save/reopen; they do not authenticate source transactions or implement AI generation.

Fixed-expense rows optionally carry `frequency`: `MONTHLY`, `QUARTERLY`, `HALF_YEARLY` or `YEARLY`. Missing frequency means monthly. `amountOere` is the amount per payment; totals contain monthly allocations. Income, spending and savings rows reject frequency. Fixed-expense original-suggestion metadata may also preserve the original frequency. Older monthly plans remain valid without changes.
