# Backend setup task

Status: infrastructure task supporting US-01 and NFR-05/NFR-07; not an implementation of budget creation.

As a developer, I want a testable HTTP backend and an isolated development database connection so that the first budget workflow can be implemented safely.

## Acceptance criteria

1. GET /health returns HTTP 200 and a small JSON liveness response without requiring a database or exposing configuration.
2. Unknown paths return JSON with HTTP 404.
3. Local development and a compiled start command work; the application export does not bind a listening port when imported by Vercel or tests.
4. A separate check:db command executes a read-only SELECT 1 against the configured Neon development branch. Missing or failed connections exit unsuccessfully without printing credentials or raw driver errors.
5. Secrets and generated files are ignored by Git; the committed environment example contains no credentials.
6. Tests, typecheck and build commands are documented and runnable from the repository root.

This task does not add domain tables, import the bank dataset, provision authentication or deploy to Vercel. Database schema and budget endpoints are subsequent work. Web/native directories remain scaffolds and are not yet npm workspaces.
