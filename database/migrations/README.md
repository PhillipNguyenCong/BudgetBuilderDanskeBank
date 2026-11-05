# Database migrations

Status: directory scaffold; no domain schema or executable migrations have been added. Neon development and production branches are documented in the [backend setup](../../docs/backend-setup.md).

Version-controlled PostgreSQL schema migrations will live here. Select the migration tool and document its commands before adding executable migrations.

- Review schema changes against the requirements and [domain model](../../domain-model-notes.md).
- Enforce one account per budget, account exclusivity, typed virtual pots and valid same-account savings targets.
- Preserve monthly results and completed rollover destinations. Enforce uniqueness per source spending pot and month and apply virtual amount updates atomically with the rollover record.
- Apply changes through a documented migration process.
- Preserve already-applied migration history; make subsequent changes in new migrations.
- Keep source transactions separate from customer budget corrections.
- Do not store credentials, database dumps or banking datasets in this directory.

Before cloud import, confirm that the supplied dataset is approved for that destination. Synthetic fixtures and migrations must remain distinct.
