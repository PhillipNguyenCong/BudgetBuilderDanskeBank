import { migrate } from 'drizzle-orm/neon-http/migrator';
import { getDatabase } from '../src/infrastructure/database/client.js';
if (process.env.ALLOW_DATABASE_MIGRATIONS !== 'true')
  throw new Error('Set ALLOW_DATABASE_MIGRATIONS=true only for the intended database.');
await migrate(getDatabase(), { migrationsFolder: 'database/migrations' });
console.log('Migrations applied.');
