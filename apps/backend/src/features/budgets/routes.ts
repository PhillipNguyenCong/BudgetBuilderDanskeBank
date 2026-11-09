import { Router } from 'express';
import {
  IdSchema,
  CreateBudgetSchema,
  UpdateBudgetSchema,
  BudgetListSchema,
} from '@budget-builder/contracts';
import type { BudgetService } from './service.js';
import { owner } from '../../shared/identity.js';
export function budgetRoutes(service: BudgetService) {
  const router = Router();
  router.get('/budgets', async (_req, res) => {
    res.json(BudgetListSchema.parse(await service.list(owner(res))));
  });
  router.get('/budgets/:id', async (req, res) => {
    res.json(await service.get(owner(res), IdSchema.parse(req.params.id)));
  });
  router.post('/budgets', async (req, res) => {
    const input = CreateBudgetSchema.parse(req.body);
    const result = await service.create(owner(res), input.accountId, input.plan);
    res
      .status(201)
      .location('/api/v1/budgets/' + result.id)
      .json(result);
  });
  router.put('/budgets/:id', async (req, res) => {
    const input = UpdateBudgetSchema.parse(req.body);
    res.json(
      await service.update(
        owner(res),
        IdSchema.parse(req.params.id),
        input.expectedRevision,
        input.plan,
      ),
    );
  });
  return router;
}
