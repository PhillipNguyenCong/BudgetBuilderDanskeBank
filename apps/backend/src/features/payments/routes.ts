import { Router } from 'express';
import { IdSchema, PageQuerySchema, PaymentPageSchema } from '@budget-builder/contracts';
import type { AccountService } from '../accounts/service.js';
import { owner } from '../../shared/identity.js';
export function paymentsRoutes(service: AccountService) {
  const router = Router();
  router.get('/accounts/:id/payments', async (req, res) => {
    res.json(
      PaymentPageSchema.parse(
        await service.payments(
          owner(res),
          IdSchema.parse(req.params.id),
          PageQuerySchema.parse(req.query),
        ),
      ),
    );
  });
  return router;
}
