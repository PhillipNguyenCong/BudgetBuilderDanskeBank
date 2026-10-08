# Backend

Status: directory scaffold; no running API or deployed service yet.

The TypeScript backend is intended to run on Vercel and use Neon PostgreSQL for persistence. Neon provides the database; this application provides the API and business operations.

- Serve both the web application and the future native mobile application.
- Validate requests and enforce user access before reading or changing budgets.
- Coordinate imports, budget persistence and forecast generation.
- Run authoritative budget calculations through `packages/budget-core`.
- Share request and response contracts through `packages/contracts`.
- Keep database credentials server-side; do not log raw banking records.

Database schema changes belong in `database/migrations`. Framework, authentication, deployment configuration and executable commands will be documented during implementation.
