# Budget core

Status: directory scaffold; the existing local experiment has not been migrated.

Framework-independent TypeScript logic for normalisation, categorisation, payment reconciliation and forecasting belongs here.

- Keep calculations separate from HTTP, UI, storage and deployment code.
- Pass dates and required data explicitly for reproducible tests.
- Use integer oere or exact decimal arithmetic for monetary values.
- Report missing or uncertain data explicitly rather than treating it as zero.
- Keep the customer budget plan distinct from the forecast estimate.

The backend runs authoritative calculations. Review the existing local budget-core experiment against the current requirements before migrating it. No old repository is a source of current requirements.
