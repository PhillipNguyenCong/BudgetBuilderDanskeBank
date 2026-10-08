import { sql } from 'drizzle-orm';
import { getDatabase } from '../src/infrastructure/database.js';

try {
  const result = await getDatabase(AbortSignal.timeout(10000)).execute(sql`select 1 as connected`);
  if (result.rows[0]?.connected !== 1) throw new Error('Unexpected connection-check result');
  console.log('Database connection OK (SELECT 1).');
} catch {
  // Driver errors can contain connection details. Keep terminal/CI output safe.
  console.error('Database check failed. Verify DATABASE_URL, branch availability and network access.');
  process.exitCode = 1;
}
