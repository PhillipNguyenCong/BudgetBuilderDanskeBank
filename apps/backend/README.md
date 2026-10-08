# Backend

Express + TypeScript backend with Drizzle and the Neon HTTP driver. This first setup implements liveness and database connectivity only. Budget endpoints, authentication, domain tables, migrations and deployment are subsequent work.

## Requirements and setup

Use Node.js 22.9+ or 24 (tested with 24.2) and npm. Run all commands below from the repository root.

```sh
npm ci
cp apps/backend/.env.example apps/backend/.env
```

Set DATABASE_URL in apps/backend/.env to the pooled connection string for the Neon **development** branch and database budget_builder. The file is ignored by Git; never put credentials in .env.example, source code, screenshots or logs. The health endpoint works without this variable.

```sh
npm run dev:backend
```

Open http://127.0.0.1:3001/health. It returns HTTP 200 with status and service name. This is liveness, not database readiness. Database errors therefore cannot break the health endpoint. The local server binds only to loopback.

## Verification commands

```sh
npm test
npm run typecheck
npm run build
npm run check:db
```

Tests do not contact Neon. They exercise HTTP behaviour and invalid/missing configuration. check:db performs SELECT 1 through Drizzle and the Neon driver, with a 10-second timeout and safe error output. It does not create tables or import data. Running it requires network access.

After building, run the compiled backend with:

```sh
npm run start --workspace @budget-builder/backend
```

No lint or migration script is configured yet. A failed check is not a successful verification.

## Structure

- src/index.ts: Express composition and default app export for Vercel; no listener on import.
- src/server.ts: local listening process.
- src/features/health: health route and HTTP tests.
- src/infrastructure/database.ts: lazy database client construction and configuration validation.
- scripts/check-database.ts: explicit read-only connection check.

Neon project: BudgetBuilderDanskeBank, PostgreSQL 18, AWS Frankfurt. The development branch is separate from the default production branch. Do not use production credentials for development checks or future test resets.

## Vercel handoff (not deployed)

The backend entry src/index.ts exports the Express app for Vercel's native Express support. When deployment is requested, use apps/backend as the backend project's root directory, install from the committed npm workspace lockfile and configure server-only DATABASE_URL for the intended environment. Do not expose it as a frontend variable. Keep preview and production database configuration separate.

This task does not create a Vercel project or configure a frontend. Verify the current workspace installation settings during the first deployment. See [Vercel Express documentation](https://vercel.com/docs/frameworks/backend/express).
