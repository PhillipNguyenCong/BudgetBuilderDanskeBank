# AGENTS.md

## Scope and project context

These instructions apply to BudgetBuilderDanskeBank and all its subdirectories. Follow more specific nested AGENTS.md files where present. Explicit current user instructions take precedence over repository guidance.

This is a fresh bachelor-project repository for a Danske Bank budget-builder prototype. Do not import assumptions, paths, commands or implementation from the old bachelor-project repository. Review any proposed migration against this repository's current requirements first.

Write code identifiers, comments and project documentation in English. User-facing conversation may be Danish. Preserve the distinction between proposed behaviour, implemented functionality and evaluated results.

## Read before working

Before implementation, read:

1. [README.md](README.md)
2. [Architecture.md](Architecture.md)
3. [Requirements](docs/requirements.md)
4. [User stories](docs/user-stories.md)
5. [Delivery and evaluation plan](docs/delivery-plan.md)
6. The README and any nested AGENTS.md in each area you change.

For product or UX decisions, also read [Personas](docs/personas.md). These are hypotheses, not validated research findings. Do not require nonexistent PRD.md, Security.md or Skills.md files from the old project.

## Product constraints

- Budget intelligence is presented through calculations, forecasts, warnings and short explanations, not a chatbot.
- Support multiple independent budgets. Each budget has at least one account; an account belongs to at most one budget at a time.
- Distinguish income, fixed expenses, variable expenses and savings allocations.
- Keep the budget plan distinct from the forecast estimate. Do not cap predicted spending at the planned amount.
- Explain data uncertainty. Missing amounts are not zero; unknown payment directions are not confirmed expenses.
- Use DKK and approved demonstration data for the prototype.
- Deliver the responsive web flow first. Native mobile implementation is a later phase unless the user changes the priority.

## Repository responsibilities

| Path | Responsibility |
| --- | --- |
| apps/web | Responsive React, TypeScript and Vite web application |
| apps/backend | TypeScript HTTP backend intended for Vercel; authoritative workflows and calculations |
| apps/mobile | Future React Native client using the same backend |
| packages/budget-core | Framework-independent normalisation, categorisation, reconciliation and forecasting |
| packages/contracts | Shared API request/response types, errors and runtime validation schemas |
| database/migrations | Version-controlled PostgreSQL schema changes for Neon |
| docs | Personas, requirements, user stories, decisions and evaluation planning |

Neon provides the database; apps/backend provides the API. Clients never connect directly to Neon or receive database credentials.

## Frontend architecture

Follow the structure in Architecture.md:

- app: startup, routes, providers and feature-screen composition.
- foundation/components: reusable domain-agnostic UI primitives.
- foundation/styles: shared colour, typography, spacing and global styles.
- features: business-specific components, containers, hooks and API calls.
- lib: shared technical utilities such as the HTTP client.

Foundation must not import features, perform business API calls or know about budgets. Local UI state such as an open dropdown is allowed. Feature display components receive props and callbacks; containers coordinate requests, screen state, loading, errors and user actions.

Keep components single responsibility. Keep feature-specific code within its feature. Expose a small public interface through index.ts when another feature needs access; do not import feature internals or introduce circular dependencies. Create subdirectories only when needed.

Keep state close to its owner. Use global providers only for cross-cutting concerns. Do not duplicate financial algorithms in UI code. Support keyboard interaction, labelled controls, readable amounts and explicit loading, empty, error and uncertainty states. Colour must not be the sole signal.

## Backend and shared logic

- Routes handle HTTP boundaries and request validation.
- Services coordinate access checks, workflows, repositories, calculation modules and transaction boundaries.
- Repositories handle persistence queries and mapping.
- Infrastructure owns database connections and external adapters.
- Shared backend utilities must not become a miscellaneous business-logic folder.

Validate requests at runtime even when TypeScript types exist. Derive identity from trusted server authentication context and enforce ownership on every relevant operation. Client-supplied customer IDs are not proof of ownership. Enforce account-to-budget exclusivity atomically, including concurrent requests.

Budget-core must not depend on React, HTTP, database drivers or hosting frameworks. Pass dates and inputs explicitly. Use integer oere or exact decimal arithmetic. Test duplicate records, internal transfers, cancelled payments, irregular bills and insufficient data. Separate successful budget persistence from unavailable forecasting in response contracts and UI behaviour.

## Data, security and persistence

Keep imported source records distinguishable from customer corrections so re-imports do not erase overrides. Report uncertain or invalid records instead of silently discarding or repairing them. Avoid double counting between transactions, planned payments and monthly planning allocations.

Never commit credentials, real financial records, database dumps or raw banking datasets. Do not log sensitive payloads. Use synthetic fixtures for automated tests. Confirm the supplied dataset's permitted use before uploading it to any external service; access to a file is not permission to publish it.

Use an isolated test database for integration tests. Never run destructive resets against a shared or production database. Preserve applied migration history and add new migrations for subsequent changes. Do not provision cloud resources, deploy services or apply shared-database migrations merely because a local feature needs them; keep those actions within the user's authorised task.

## Feature workflow

Use these responsibilities in sequence; they do not require separate agents for every task:

1. Story: select or write a small user story and acceptance criteria before implementation. Preserve stable FR, NFR and US identifiers.
2. Tests: define expected behaviour and add meaningful tests before implementation where practical, especially for calculations, data quality and important UI behaviour.
3. Implementation: make the smallest complete change that satisfies the criteria and architecture.
4. Review: check correctness, security, accessibility, data handling, TypeScript quality and scope against the project documents.
5. Fix: resolve important findings and re-review affected behaviour.
6. Verify: run the applicable available checks and report results and limitations.

For documentation-only changes, verify content, relative links and consistency rather than inventing code tests. Do not silently change acceptance criteria to match an implementation. Record consequential decisions in the relevant document.

## Commands and current setup

At the time this file was introduced, application and package directories contained responsibility READMEs only. Workspace tooling, executable scripts, migration commands and deployment configuration were not initialised.

Inspect the actual manifests and lockfiles before choosing commands or a package manager. Do not claim that npm test, lint or build scripts exist without checking. When initialising a workspace, document its exact development, test, typecheck, lint and build commands in that workspace's README and update this section. Run the relevant checks once available. If a check cannot run, report the specific reason rather than reporting success.

## Git and completion

Inspect the branch, working tree and current diff before editing. Preserve unrelated user changes. Use focused commits and feature branches named codex/<short-description> when a new branch is appropriate. Do not assume a dev branch exists or automatically merge into main. Follow the user's requested delivery workflow and the repository's actual branch rules; never force-push or discard unrelated changes as routine cleanup.

A completion report should state what changed, which story or requirement it addresses, what was verified and what remains unresolved. Distinguish automated correctness checks from usability findings and measured forecast accuracy. Keep README and Architecture.md consistent with structural changes.
