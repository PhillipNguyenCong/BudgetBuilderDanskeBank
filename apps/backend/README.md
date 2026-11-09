# Backend foundation

A TypeScript/Express modular monolith with feature services, replaceable persistence and a replaceable bank-data provider. The current delivery implements data normalization and budget setup/editing, not AI generation, forecasts, transaction assignment or month closure.

## Run locally

Use Node.js 22.9+ or 24 and npm. From the repository root:

```sh
npm ci
npm run build
npm run dev:backend
```

The server listens on http://127.0.0.1:3001. Without configuration it uses an independently authored synthetic fixture, one server-controlled demo user and an in-memory budget repository. Budgets disappear when the process restarts. Neither the bank provider nor storage contacts an external service in this mode.

To use your approved synthetic file, set `BANK_DATA_FILE` to its absolute local path in ignored `apps/backend/.env`. The file is loaded and normalized once, on first access. Restart to reload it. `DATA_AS_OF` can explicitly override the dataset metadata cutoff. Neither path nor raw payload is returned to clients or logged. The supplied file was approved as synthetic/cloud-permitted, but has not been uploaded or committed.

```dotenv
BUDGET_STORAGE=memory
# BANK_DATA_FILE=/absolute/path/to/approved-demo-data.json
# DATA_AS_OF=2026-09-03T12:00:00Z
```

Do not expose this demo runtime publicly. `NODE_ENV=production` or `VERCEL` disables demo identity. A future authenticated composition must call `createApp` with a trusted identity provider. Request headers and bodies do not choose the owner.

## Contracts and HTTP API

See [OpenAPI](../../docs/openapi.json), [create request](../../docs/examples/create-budget.json) and [response](../../docs/examples/budget-response.json). Shared runtime schemas and inferred types live in `@budget-builder/contracts`.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | /api/v1/me | Current server-owned profile: id, nullable displayName, isDemo |
| GET | /health | Liveness, independent of provider/database readiness |
| GET | /api/v1/accounts | Owned accounts, masked identifiers, data quality |
| GET | /api/v1/accounts/:id/transactions | Normalized records and quality metadata |
| GET | /api/v1/accounts/:id/payments | Normalized planned payments, distinct from transactions |
| GET | /api/v1/budgets | Owned saved budgets |
| GET | /api/v1/budgets/:id | Plan, derived totals, revision and timestamps |
| POST | /api/v1/budgets | Create one budget per owned account; returns 201 and Location |
| PUT | /api/v1/budgets/:id | Replace the reviewed plan using expectedRevision |

Transaction/payment reads accept `limit` (1–100, default 50), `offset` (0–100000, default 0), `from` and `to` (inclusive ISO dates). Order is date ascending, then stable internal ID, with undated records last. Date filters exclude undated records and report that limitation. Unknown statuses and cancelled payments remain visible; these read APIs do not pretend to produce forecast-eligible cash flows.

Money is integer øre. Missing imported money is null; zero stays zero. Widget totals and unallocated income are server-derived. Monthly income rows fund typed pots. Color is one of OCEAN, SKY, MINT, LAVENDER, SAND, ROSE. Rows are ordered arrays with stable IDs. Inputs have protective limits (100 pots, 1000 rows per widget, 1 MiB request bodies), not Figma's demonstration limits.

PUT cannot change accountId. It saves exactly the submitted rows and does not silently redistribute savings or regenerate suggestions. Cancel means do not submit PUT. Rollover settings are stored and validated, but are not executed. Defaults in the create example have automation disabled. Sources/explanations attached to rows are user-submitted planning provenance, not trusted proof of a bank movement.

A stale update or occupied account returns 409; invalid structure returns 400; excess allocation or aggregate overflow returns 422. Error responses contain a safe code/message, with request IDs and field paths where applicable. Unexpected internal details and financial payloads are not logged or returned.

## Boundaries

- `app.ts`: injectable HTTP composition, no listener or database connection on import.
- `runtime.ts`: local memory/PostgreSQL selection and demo identity guard.
- `features/*/routes.ts`: HTTP validation and response mapping.
- `features/budgets/service.ts`: ownership, validation and save workflows.
- `features/budgets/repository.ts`: storage interface; memory and PostgreSQL implementations.
- `infrastructure/banking`: provider interface and cached JSON adapter. The interface supports multiple accounts; this fixture exposes one.
- `packages/budget-core`: exact allocation totals and normalization, independent of Express and persistence. Normalization uses Node's SHA-256 for source fingerprints and runs on the backend.

## PostgreSQL (explicit opt-in)

Set `BUDGET_STORAGE=postgres` and the development `DATABASE_URL` to use durable budgets after reviewing and applying migrations. PostgreSQL stores current budget aggregates in JSONB with separate owner/account/revision fields. One unique account index protects concurrent creation; one revision-conditioned UPDATE saves the entire plan atomically. No multi-query partial-plan save is used.

```sh
npm run migrations:generate
# Only against the deliberately selected database:
ALLOW_DATABASE_MIGRATIONS=true npm run migrations:apply
```

Migrations are generated, not applied by normal startup/tests. The bank-data source is independent from budget storage: PostgreSQL mode does not upload bank data. This initial aggregate is the editable current plan; it is not a historical ledger. Monthly snapshots, effective-date policies and rollover execution require later schema/service work.

## Verification

```sh
npm test
npm run typecheck
npm run build
npm run check:contracts
npm run format:check
```

All default tests use memory and synthetic fixtures. HTTP tests bind ephemeral loopback ports; they need no internet. PostgreSQL tests inspect parameterized SQL and error mapping with a fake query runner. Live PostgreSQL integration is not verified by these tests. `npm run check:db` is a separate explicit read-only network check, not part of the test suite.

`npm run docs:api` regenerates OpenAPI and examples. `npm run check:contracts` checks for stale artifacts. No frontend, Figma, cloud deployment or live bank integration is part of this delivery.

## Dependency review

Compatible updates removed the runtime body-parser/qs advisories. npm audit still reports four moderate entries in the development-only Drizzle Kit → esbuild-kit → esbuild chain. The reported fix downgrades Drizzle Kit incompatibly; it was not applied. This project uses migration generation, not the affected esbuild development server. Revisit the tooling dependency when its upstream release resolves the advisory.

## Demo user and local source

`GET /api/v1/me` returns the profile for the trusted server identity. In the local runtime this is `demo-user`. The JSON adapter derives the display name only from `account.ownerName`; missing, blank or non-string values become null. It marks this synthetic profile `isDemo: true`. The name is descriptive data, not authentication. No login or user database is implemented.

The user service depends on the bank-provider interface. Profile and normalized account data share one cached load, including concurrent requests. Returned objects are copies. The configured file belongs to the server-configured demo owner: transaction `ownAccount` values do not create identities or extra accounts. Other identities cannot read its profile or banking data.

Set `BANK_DATA_FILE` in the ignored local `.env` to use your approved dataset. Without a configured path, the independently authored fixture is used. A configured unreadable, invalid JSON or structurally invalid file returns HTTP 503 `BANK_DATA_UNAVAILABLE`; no fallback fixture, path, raw payload or parser details are exposed. The failed load is cached too: correct the file/configuration and restart the backend. `/health` is liveness only and can still return 200.

See the [profile example](../../docs/examples/user-profile-response.json) and [delivery verification](../../docs/demo-user-story.md). No dataset is uploaded or committed. Transaction counts include normalized records of various directions/statuses and are not unique purchase counts. Coverage metadata describes the source period, not twelve months of usable spending.
