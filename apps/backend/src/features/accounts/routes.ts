import { Router } from 'express';
import {
  SalarySuggestionSchema,
  AccountListSchema,
  BillSuggestionsSchema,
  IdSchema,
} from '@budget-builder/contracts';
import type { AccountService } from './service.js';
import { owner } from '../../shared/identity.js';
export function accountRoutes(service: AccountService) {
  const router = Router();
  router.get('/accounts', async (_req, res) => {
    res.json(AccountListSchema.parse(await service.list(owner(res))));
  });
  router.get('/accounts/:id/salary-suggestion', async (req, res) => {
    res.json(
      SalarySuggestionSchema.parse(
        await service.salarySuggestion(owner(res), IdSchema.parse(req.params.id)),
      ),
    );
  });
  router.get('/accounts/:id/bill-suggestions', async (req, res) => {
    res.json(
      BillSuggestionsSchema.parse(
        await service.billSuggestions(owner(res), IdSchema.parse(req.params.id)),
      ),
    );
  });
  return router;
}
