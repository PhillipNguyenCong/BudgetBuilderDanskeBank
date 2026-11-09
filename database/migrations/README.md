# Database migrations

Drizzle-generated PostgreSQL migrations for the current budget aggregate. The initial table has an owner index, unique account constraint, positive revision constraint and JSON-object plan. Detailed plan validity is enforced by the service's shared schemas and allocation rules before persistence.

From the repository root:

```sh
npm run migrations:generate
ALLOW_DATABASE_MIGRATIONS=true npm run migrations:apply
```

Generation needs no database. Application reads the ignored development DATABASE_URL and must be an explicit action against the intended database. Neither startup nor tests apply migrations. Preserve applied migrations and add subsequent files instead of rewriting history. Raw banking data and synthetic fixtures are not migrations.

This task generated the migration only. Live database application and integration have not been verified. Monthly history/rollover tables are deferred; the current-plan aggregate is not a month-end ledger.
