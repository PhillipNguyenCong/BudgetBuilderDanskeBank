# Budget Builder for Danske Bank

A bachelor-project prototype exploring how customers can create and adjust separate budgets, understand spending changes and anticipate cash-flow shortfalls. Budget intelligence appears through forecasts, warnings and short explanations rather than a chatbot.

## Project documentation

- [Agent instructions](AGENTS.md): working rules, architecture boundaries, verification and safe data handling.

- [Architecture](Architecture.md): foundation and feature boundaries, backend responsibilities and data flow.
- [Budget creation flow](docs/budget-creation-flow.md): AI suggestions, optional automatic rollover and the month-end prompt.
- [Domain model](domain-model-notes.md): core concepts, allocation rules and monthly rollover, with [Mermaid source](domain-model.mmd) and [image](domain-model.png).

- [Personas](docs/personas.md): preliminary audience hypotheses and validation questions.
- [Requirements](docs/requirements.md): functional requirements and proposed quality targets.
- [User stories](docs/user-stories.md): MVP stories in customer-journey order, with acceptance criteria and requirement links.
- [Delivery and evaluation plan](docs/delivery-plan.md): implementation order, testing and open decisions.

These documents are the initial planning baseline, not evidence that functionality has been implemented or evaluated. Personas and quantitative quality targets require validation with the supervisor and representative users.

## Agreed scope

- Multiple independent budgets; each uses exactly one user-owned account. An account belongs to at most one budget at a time.
- Named virtual savings, spending and fixed-expense subaccounts divide the monthly take-home salary.
- Monthly and weekly spending allowances, with a supplementary daily guide. Positive month-end leftovers follow a saved preference when automation is enabled; otherwise the monthly summary asks where they should go.
- Reviewable suggestions for income, fixed expenses, variable expenses and savings.
- DKK reporting, explicit data-quality limitations and protection against double counting.
- A transparent rules-based forecast first; any later statistical or AI-assisted approach must be compared with that baseline.
- Demonstration data only; no payment execution or live bank integration in the initial prototype.

## Repository structure

```text
apps/
  web/                 # Responsive React + TypeScript + Vite web application
  backend/             # TypeScript backend hosted on Vercel
  mobile/              # React Native / Expo application (first frontend delivery)
packages/
  budget-core/         # Framework-independent budget calculations
  contracts/           # Shared API types and validation schemas
database/
  migrations/          # PostgreSQL schema migrations
docs/                  # Personas, requirements, stories and delivery plan
```

Neon is the PostgreSQL database provider. Both clients use the backend API; only the backend accesses Neon and runs authoritative calculations. The native mobile shell is the first frontend delivery. Responsive web implementation is deferred.

Current status: the backend foundation implements normalized account/transaction/payment reads, budget create/edit APIs and a centralized live-budget snapshot calculation. Shared contracts and budget-core are initialized. Local development/tests default to memory with a cached synthetic JSON provider; a PostgreSQL budget adapter and generated migration are available by explicit opt-in. No migration was applied, bank dataset uploaded or deployment performed. The native mobile shell provides four tabs, account selection, manual budget creation and a saved-plan overview; web remains a scaffold. See [backend commands](apps/backend/README.md), [OpenAPI](docs/openapi.json) and [foundation acceptance criteria](docs/backend-foundation-story.md).

## Working with the documentation

Keep requirement and story IDs stable. Update acceptance criteria when a decision changes and link implementation work and tests to the relevant IDs. Record assumptions separately from observed results. Completed unit tests alone do not demonstrate forecast accuracy or usability.

This is a fresh repository. The previous bachelor-project repository is not an implementation template or source of current requirements. The agreed directory structure is recorded above. The architectural direction is recorded in Architecture.md. Agent working rules are recorded in AGENTS.md. Forecasting, AI algorithms, saved-plan editing and monthly history/rollover execution remain subsequent work. Rules-based transaction attribution and snapshot spending guidance are now implemented.

## Run the mobile app

Use Node 24 LTS (at least 24.3; `.nvmrc` selects 24) and npm. From this repository root:

```sh
npm ci
npm run dev:mobile
```

Open the QR code in Expo Go on your iPhone, using the same local network. Metro does not start the backend. The offline sample preview needs no backend; creation and spending/activity require the local backend. See [mobile setup and verification](apps/mobile/README.md) and [shell acceptance criteria](docs/mobile-shell-story.md).

The backend now exposes the current demo profile at `GET /api/v1/me`, sharing its source with owner-scoped account, transaction and payment reads. Configure the approved local file through ignored backend settings; no user database or login is introduced. See [demo-user delivery](docs/demo-user-story.md).

Mobile Create budget now follows account selection → widget entry → Create budget → saved-plan overview. Income, spending and savings start blank. The first Add bills tap discovers editable recurring bills from the selected account; clearer patterns fill an untouched bill editor and possible bills need explicit review. Suggestions are cached in the draft, preserve manual edits and never save automatically. Savings changes require explicit input/review, and optional rollover preferences are saved without executing month-end movements. Saved budgets are loaded when returning to Budget. Full AI budget generation remains deferred. See [on-demand bill discovery](docs/mobile-bill-suggestions-story.md).

The editor shows live “left to allocate” guidance while filling the pots, based on entered amounts and clearly marked as provisional when amounts are missing. It does not automatically distribute income. See [allocation guidance](docs/mobile-allocation-guidance-story.md).

The offline **Preview sample widgets** entry remains available. For physical phones, use the opt-in LAN setup in [mobile instructions](apps/mobile/README.md). See [manual creation criteria and verification](docs/mobile-budget-creation-story.md). Default memory storage loses saved budgets on backend restart; no shared database migration or deployment is part of this delivery.

The saved Budget screen now leads with spending remaining this month, next-seven-days and daily guidance using the linked account’s source-date snapshot. Transactions appear automatically, with explainable attribution, uncertainty states and optional persisted corrections. Matched bills reduce Fixed expenses; other eligible debits reduce Spending. Known pending and unconfirmed debits reduce the relevant remainder immediately and remain labelled separately from booked spending. Spending/Fixed expenses pots open native Budget-stack details and activity without losing the bank header or tab bar. The supplied source opens on 3 September 2026; this is a demonstration snapshot with zero configured opening carry-in. Forecasts, accumulated balances, monthly history and rollover execution remain unavailable. See the [live-budget criteria](docs/mobile-live-budget-story.md), [spending delivery](docs/mobile-spending-story.md) and [earlier saved-plan slice](docs/mobile-saved-overview-story.md).

The mobile frontend uses focused account-selection, creation, editor, overview, preview and shared-budget features. See the [mobile structure](apps/mobile/README.md#structure) and [maintenance verification](docs/mobile-feature-refactor-story.md).
