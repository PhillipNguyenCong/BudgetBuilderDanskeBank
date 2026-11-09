import { Router } from 'express';
import { AccountListSchema } from '@budget-builder/contracts';
import type { AccountService } from './service.js';
import { owner } from '../../shared/identity.js';
export function accountRoutes(service: AccountService) {
  const router = Router();
  router.get('/accounts', async (_req, res) => {
    res.json(AccountListSchema.parse(await service.list(owner(res))));
  });
  return router;
}
