# Budget Builder for Danske Bank

A bachelor-project prototype exploring how customers can create and adjust separate budgets, understand spending changes and anticipate cash-flow shortfalls. Budget intelligence appears through forecasts, warnings and short explanations rather than a chatbot.

## Project documentation

- [Agent instructions](AGENTS.md): working rules, architecture boundaries, verification and safe data handling.

- [Architecture](Architecture.md): foundation and feature boundaries, backend responsibilities and data flow.

- [Personas](docs/personas.md): preliminary audience hypotheses and validation questions.
- [Requirements](docs/requirements.md): functional requirements and proposed quality targets.
- [User stories](docs/user-stories.md): eight MVP stories with acceptance criteria and requirement links.
- [Delivery and evaluation plan](docs/delivery-plan.md): implementation order, testing and open decisions.

These documents are the initial planning baseline, not evidence that functionality has been implemented or evaluated. Personas and quantitative quality targets require validation with the supervisor and representative users.

## Agreed scope

- Multiple independent budgets; each contains at least one account. An account belongs to at most one budget at a time.
- Reviewable suggestions for income, fixed expenses, variable expenses and savings.
- DKK reporting, explicit data-quality limitations and protection against double counting.
- A transparent rules-based forecast first; any later statistical or AI-assisted approach must be compared with that baseline.
- Demonstration data only; no payment execution or live bank integration in the initial prototype.

## Repository structure

```text
apps/
  web/                 # Responsive React + TypeScript + Vite web application
  backend/             # TypeScript backend hosted on Vercel
  mobile/              # Future React Native application
packages/
  budget-core/         # Framework-independent budget calculations
  contracts/           # Shared API types and validation schemas
database/
  migrations/          # PostgreSQL schema migrations
docs/                  # Personas, requirements, stories and delivery plan
```

Neon is the PostgreSQL database provider. Both clients use the backend API; only the backend accesses Neon and runs authoritative calculations. The web application supports desktop and mobile browsers; the native application is a later phase.

Current status: the backend npm workspace has a working health endpoint and a read-only Neon connection check. Neon has separate production and development branches. Web, mobile and shared packages remain scaffolds. No domain tables, bank-data import or Vercel deployment have been added. See [backend setup](docs/backend-setup.md) and [backend commands](apps/backend/README.md).

## Working with the documentation

Keep requirement and story IDs stable. Update acceptance criteria when a decision changes and link implementation work and tests to the relevant IDs. Record assumptions separately from observed results. Completed unit tests alone do not demonstrate forecast accuracy or usability.

This is a fresh repository. The previous bachelor-project repository is not an implementation template or source of current requirements. The agreed directory structure is recorded above. The architectural direction is recorded in Architecture.md. Agent working rules are recorded in AGENTS.md. Budget-core migration, domain schema and user-facing features remain subsequent work.
