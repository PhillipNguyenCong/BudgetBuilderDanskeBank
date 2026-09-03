# Frontend Prototype

React + TypeScript + Vite prototype for the Danske Bank budget builder.

## Commands

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

## Structure

- `src/app`: app entry and route selection.
- `src/foundation`: generic reusable UI components.
- `src/features/budget`: budget-specific components, containers, data, logic, types, and tests.
- `src/shared`: reusable utilities.

## Rules

- Keep foundation components generic.
- Put budget-specific UI in `features/budget/components`.
- Put screen state and calculation calls in `features/budget/containers`.
- Keep budget and forecast logic as pure TypeScript functions.
- Use sample DKK data only.

