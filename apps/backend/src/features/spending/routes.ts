import { Router } from 'express';
import {
  ActivityQuerySchema,
  BudgetActivitySchema,
  ClassifiedTransactionSchema,
  CorrectTransactionSchema,
  IdSchema,
} from '@budget-builder/contracts';
import { owner } from '../../shared/identity.js';
import type { SpendingService } from './service.js';
export function spendingRoutes(service: SpendingService) {
  const router = Router();
  router.get('/budgets/:id/spending', async (req, res) =>
    res.json(await service.summary(owner(res), IdSchema.parse(req.params.id))),
  );
  router.get('/budgets/:id/activity', async (req, res) =>
    res.json(
      BudgetActivitySchema.parse(
        await service.activity(
          owner(res),
          IdSchema.parse(req.params.id),
          ActivityQuerySchema.parse(req.query),
        ),
      ),
    ),
  );
  router.get('/budgets/:id/transactions/:transactionId', async (req, res) =>
    res.json(
      ClassifiedTransactionSchema.parse(
        await service.transaction(
          owner(res),
          IdSchema.parse(req.params.id),
          IdSchema.parse(req.params.transactionId),
        ),
      ),
    ),
  );
  router.put('/budgets/:id/transactions/:transactionId/correction', async (req, res) =>
    res.json(
      await service.correct(
        owner(res),
        IdSchema.parse(req.params.id),
        IdSchema.parse(req.params.transactionId),
        CorrectTransactionSchema.parse(req.body),
      ),
    ),
  );
  return router;
}
