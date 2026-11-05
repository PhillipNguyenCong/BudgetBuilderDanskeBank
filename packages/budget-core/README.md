# Budget core

Status: directory scaffold; the existing local experiment has not been migrated.

Framework-independent TypeScript logic for salary-allocation validation, monthly/weekly spending guidance, rollover amounts, normalisation, categorisation, payment reconciliation and forecasting belongs here. Follow the [domain rules](../../domain-model-notes.md).

- Keep calculations separate from HTTP, UI, storage and deployment code.
- Pass dates and required data explicitly for reproducible tests.
- Use integer oere or exact decimal arithmetic for monetary values.
- Report missing or uncertain data explicitly rather than treating it as zero.
- Keep the customer budget plan distinct from the forecast estimate.
- Include carried-in money in spending allowances; exclude virtual allocation and rollover from cash-flow movements.
- Return deterministic rollover results; persistence, atomic application and scheduling belong to the backend.

The backend runs authoritative calculations. Review the existing local budget-core experiment against the current requirements before migrating it. No old repository is a source of current requirements.
