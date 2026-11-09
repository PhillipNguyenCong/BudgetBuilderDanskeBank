import { Router } from 'express';
import { IdSchema, PageQuerySchema, TransactionPageSchema } from '@budget-builder/contracts';
import type { AccountService } from '../accounts/service.js';
import { owner } from '../../shared/identity.js';
export function transactionsRoutes(service: AccountService) {
  const router = Router();
  router.get('/accounts/:id/transactions', async (req, res) => {
    res.json(
      TransactionPageSchema.parse(
        await service.transactions(
          owner(res),
          IdSchema.parse(req.params.id),
          PageQuerySchema.parse(req.query),
        ),
      ),
    );
  });
  return router;
}
