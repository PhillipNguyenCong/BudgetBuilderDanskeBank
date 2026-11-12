import express from 'express';
import { UserService } from './features/users/service.js';
import { userRoutes } from './features/users/routes.js';
import { randomUUID } from 'node:crypto';
import { healthRouter } from './features/health/routes.js';
import { AccountService } from './features/accounts/service.js';
import { BudgetService } from './features/budgets/service.js';
import { accountRoutes } from './features/accounts/routes.js';
import { transactionsRoutes } from './features/transactions/routes.js';
import { paymentsRoutes } from './features/payments/routes.js';
import { budgetRoutes } from './features/budgets/routes.js';
import type { BankDataProvider } from './infrastructure/banking/bank-data-provider.js';
import type { BudgetRepository } from './features/budgets/repository.js';
import type { IdentityProvider } from './infrastructure/identity/demo-identity.js';
import { errorHandler } from './shared/error-handler.js';
import {
  MemoryCorrectionRepository,
  type CorrectionRepository,
} from './features/spending/repository.js';
import { SpendingService } from './features/spending/service.js';
import { MemoryBudgetRepository } from './features/budgets/memory-repository.js';
import { spendingRoutes } from './features/spending/routes.js';
export interface AppDependencies {
  bank: BankDataProvider;
  budgets: BudgetRepository;
  identity: IdentityProvider;
  clock?: () => Date;
  id?: () => string;
  corrections?: CorrectionRepository;
}
export function createApp(dependencies: AppDependencies) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.locals.requestId = randomUUID();
    next();
  });
  app.use('/health', healthRouter);
  app.use(express.json({ limit: '1mb' }));
  const accounts = new AccountService(dependencies.bank),
    budgets = new BudgetService(
      dependencies.budgets,
      accounts,
      dependencies.clock,
      dependencies.id,
    );
  app.use(
    '/api/v1',
    async (req, res, next) => {
      const identity = await dependencies.identity(req);
      if (!identity.userId) {
        res
          .status(401)
          .json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' } });
        return;
      }
      res.locals.userId = identity.userId;
      next();
    },
    userRoutes(new UserService(dependencies.bank)),
    accountRoutes(accounts),
    transactionsRoutes(accounts),
    paymentsRoutes(accounts),
    budgetRoutes(budgets),
    spendingRoutes(
      new SpendingService(
        budgets,
        accounts,
        dependencies.corrections ??
          new MemoryCorrectionRepository((ownerId, budgetId) =>
            dependencies.budgets instanceof MemoryBudgetRepository
              ? dependencies.budgets.currentRevision(ownerId, budgetId)
              : null,
          ),
        dependencies.clock,
      ),
    ),
  );
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
  });
  app.use(errorHandler);
  return app;
}
