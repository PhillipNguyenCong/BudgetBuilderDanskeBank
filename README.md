# Budget Builder for Danske Bank

A bachelor-project prototype exploring how customers can create and adjust separate budgets, understand spending changes and anticipate cash-flow shortfalls. Budget intelligence appears through forecasts, warnings and short explanations rather than a chatbot.

## Project documentation

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

## Working with the documentation

Keep requirement and story IDs stable. Update acceptance criteria when a decision changes and link implementation work and tests to the relevant IDs. Record assumptions separately from observed results. Completed unit tests alone do not demonstrate forecast accuracy or usability.

This is a fresh repository. The previous bachelor-project repository is not an implementation template or source of current requirements. Source-code migration, architecture documents and repository-specific AGENTS.md instructions are subsequent work; no framework or directory layout is imposed by these planning documents.
