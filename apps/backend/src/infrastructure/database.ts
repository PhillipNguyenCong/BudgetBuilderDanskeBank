import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

export function createDatabase(connectionString: string | undefined, signal?: AbortSignal) {
  if (!connectionString?.trim()) throw new Error('DATABASE_URL is required.');
  try {
    const url = new URL(connectionString);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.username || url.pathname.length < 2) {
      throw new Error('Invalid connection string');
    }
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string.');
  }
  const query = neon(connectionString, signal ? { fetchOptions: { signal } } : {});
  return drizzle(query);
}

// Create clients only when needed. Importing/building the app requires no secrets.
export function getDatabase(signal?: AbortSignal) {
  return createDatabase(process.env.DATABASE_URL, signal);
}
