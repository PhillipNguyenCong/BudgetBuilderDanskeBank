# Architecture

## Current Direction

The first version is a frontend-only React + TypeScript prototype in `web_app/frontend`.

No backend, database, authentication, external APIs, or real banking integrations are needed for v1.

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS
- Vitest for unit tests

## Folder Structure

Project-level documentation lives in the repository root because it applies to the whole bachelor project, not only the frontend implementation.

```text
README.md
AGENTS.md
PRD.md
Architecture.md
Security.md
Skills.md

web_app/
  backend/
    README.md
  frontend/
    src/
      app/
      foundation/
      features/
      shared/
```

Do not place project-level markdown files inside `web_app/`. The only markdown files inside `web_app/` should be implementation-specific notes such as `web_app/frontend/README.md` or `web_app/backend/README.md`.

## Architecture Pattern

Use a feature-first structure with clear responsibility boundaries.

### Foundation

`src/foundation` contains reusable UI building blocks.

Foundation components must be generic. They must not know about budgets, banks, categories, forecasts, or transactions.

Examples:

- `Button`
- `Card`
- `Badge`
- `ProgressBar`
- `Amount`
- `SectionHeader`
- `ListRow`

### Features

`src/features/budget` contains budget-specific UI, logic, data, types, and tests.

Budget feature components receive props and render UI. They should not fetch data or own complex state.

### Containers

Containers connect data, state, logic, and presentational components.

For example, `BudgetHomeContainer`:

- reads sample budget data
- calculates totals
- creates forecast insights
- handles selected category state
- passes clean props to child components

### Logic

Logic files contain pure TypeScript functions.

They must not import React or UI components.

They should be easy to unit test.

Examples:

- calculate total income
- calculate fixed and flexible spending
- calculate left to spend
- detect over-budget categories
- detect upcoming recurring payments

## Data

Use sample data only.

All money values use DKK.

Data should be shaped like realistic banking data, but must not contain real customer data.

## Branching

- `main` stays stable.
- accepted feature work is pushed to `dev`.
- feature work should be reviewed before it is merged into `main`.
