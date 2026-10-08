# Database migrations

Status: directory scaffold; no schema has been applied and no Neon database has been provisioned.

Version-controlled PostgreSQL schema migrations will live here. Select the migration tool and document its commands before adding executable migrations.

- Review schema changes against the requirements and domain model.
- Apply changes through a documented migration process.
- Preserve already-applied migration history; make subsequent changes in new migrations.
- Keep source transactions separate from customer budget corrections.
- Do not store credentials, database dumps or banking datasets in this directory.

Before cloud import, confirm that the supplied dataset is approved for that destination. Synthetic fixtures and migrations must remain distinct.
