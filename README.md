# Budget Feature For Danske Bank

Bachelor project exploring a budget builder concept for the Danske Bank mobile banking experience.

The goal is to design and prototype a calm, useful budget feature that helps customers understand monthly spending, forecast upcoming expenses, and adjust category budgets without needing an interactive chat assistant.

## Project Goal

Create a clean, user-friendly budget feature inside the Danske Bank app experience that helps customers build, understand, and adjust personal budgets with minimal effort.

The feature should make the Danske Bank app feel like the natural place to manage everyday money, not only check balances or transactions.

## Working Docs

Project-level documentation is kept in the repository root:

- [PRD.md](PRD.md)
- [Architecture.md](Architecture.md)
- [Security.md](Security.md)
- [AGENTS.md](AGENTS.md)
- [Skills.md](Skills.md)

## Current Direction

The first prototype is a frontend-only React + TypeScript app in `web_app/frontend`.

`web_app/backend` is reserved for a later version and should stay empty for now.

The prototype should prove:

- What problem the budget builder solves.
- What the main user journey looks like.
- What data the feature needs.
- How automatic budget forecasting should be shown.
- How the experience should feel inside a banking app.

## Workflow

Each feature should follow this process:

1. User Story Agent writes the story and acceptance criteria.
2. Unit Test Agent writes tests.
3. Frontend Developer Agent implements the feature.
4. Code Reviewer Agent reviews the work.
5. Frontend Developer Agent fixes important review findings.
6. Code Reviewer Agent reviews again.
7. Accepted work is pushed to `dev`.

## MVP Focus

The first useful feature is the Budget Home screen:

- Monthly income.
- Fixed expenses.
- Flexible spending.
- Savings.
- Left to spend.
- Upcoming recurring payments.
- Automatic forecast insights.
