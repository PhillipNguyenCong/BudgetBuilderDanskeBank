# Backend foundation — US-03, US-04, US-10, US-11

As a frontend developer, I need validated account data and a stable budget API so that web and mobile clients can share the same behavior.

Acceptance criteria:
1. Account data is normalized once, with masked identifiers and explicit uncertainty.
2. Income and typed pots contain editable rows; exact totals are server-derived.
3. Creation and revision-checked updates enforce ownership, account exclusivity, allocation limits and rollover target validity.
4. Savings changes only when the submitted plan changes it; no AI or month-close work runs on save.
5. Memory mode and tests require no external services. PostgreSQL is an explicit replaceable adapter.
6. Contracts, OpenAPI, examples and migrations are versioned; raw input and credentials are not.

This implements the data/setup portion of these stories, not forecasting, suggestion generation, transaction assignment or rollover execution.

## Verification — 9 November 2026

Implemented in the backend foundation feature branch. All 30 tests pass; type checks, builds, formatting and generated contract/example checks pass. The supplied file was normalized locally into 83 transactions and 14 payments with two complete coverage months; 24 transaction amounts remain unusable and both colliding-source-ID records are retained. No raw dataset was committed.

PostgreSQL SQL construction, mapping and conflict behavior were tested with an injected fake runner. The migration was generated but not applied; live PostgreSQL integration remains unverified. Tests use memory and loopback HTTP only. Dependency audit has four moderate development-tool entries remaining in the Drizzle Kit/esbuild chain; runtime request-parser advisories were patched.
