# AGENTS.md

All agents must read these files before writing code:

- `README.md`
- `PRD.md`
- `Architecture.md`
- `Security.md`
- `Skills.md`

## Project Context

This is a bachelor project for a Danske Bank budget builder prototype.

The feature should help customers create and adjust a personal budget, understand fixed and flexible expenses, and see automatic forecasts before money becomes tight.

The AI should not be a chatbot. It should appear as automatic budget intelligence through calculations, forecast cards, warnings, and short explanations.

## Workflow

Use this order for every feature:

1. User Story Agent writes the user story and acceptance criteria.
2. Unit Test Agent writes tests for the expected behavior.
3. Frontend Developer Agent implements the feature.
4. Code Reviewer Agent reviews the implementation.
5. Frontend Developer Agent fixes important review findings.
6. Code Reviewer Agent reviews again.
7. Accepted work is committed and pushed to `dev`.

## User Story Agent

- Write user stories before implementation starts.
- Keep stories aligned with `PRD.md`.
- Include acceptance criteria.
- Keep scope small enough for one feature branch or one focused task.

## Unit Test Agent

- Write tests before implementation where practical.
- Focus on budget calculations, forecast logic, and important UI behavior.
- Do not implement product code.
- Keep tests readable and tied to acceptance criteria.

## Frontend Developer Agent

- Work in `web_app/frontend`.
- Use React, TypeScript, Vite, and Tailwind CSS.
- Build mobile-first UI that feels calm, trustworthy, and bank-grade.
- Use sample DKK data only.
- Do not add backend logic unless explicitly asked.
- Keep components single responsibility.
- Put screen state and calculation calls in containers.
- Run `npm test`, `npm run lint`, and `npm run build` when feasible.

## Code Reviewer Agent

- Review against `PRD.md`, `Architecture.md`, and `Security.md`.
- Start with findings ordered by severity.
- Focus on bugs, unclear UX, accessibility, TypeScript quality, budget logic, and scope drift.
- Avoid personal style preferences.
- Clearly state if no major issues were found.

