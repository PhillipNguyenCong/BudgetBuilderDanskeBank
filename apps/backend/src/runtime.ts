import { createApp } from './app.js';
import { MemoryBudgetRepository } from './features/budgets/memory-repository.js';
import { PostgresBudgetRepository } from './features/budgets/postgres-repository.js';
import { JsonBankDataProvider } from './infrastructure/banking/json-bank-data-provider.js';
import { demoIdentity } from './infrastructure/identity/demo-identity.js';
export function createLocalRuntime(environment: NodeJS.ProcessEnv = process.env) {
  const identity = demoIdentity(environment);
  const mode = environment.BUDGET_STORAGE ?? 'memory';
  if (mode !== 'memory' && mode !== 'postgres')
    throw new Error('BUDGET_STORAGE must be memory or postgres.');
  if (mode === 'postgres' && !environment.DATABASE_URL)
    throw new Error('DATABASE_URL is required for PostgreSQL mode.');
  const bank = new JsonBankDataProvider({
    ...(environment.BANK_DATA_FILE ? { path: environment.BANK_DATA_FILE } : {}),
    ...(environment.DATA_AS_OF ? { asOf: new Date(environment.DATA_AS_OF) } : {}),
  });
  return createApp({
    identity,
    bank,
    budgets: mode === 'memory' ? new MemoryBudgetRepository() : new PostgresBudgetRepository(),
  });
}
