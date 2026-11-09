import { Router } from 'express';
import { UserProfileSchema } from '@budget-builder/contracts';
import { owner } from '../../shared/identity.js';
import type { UserService } from './service.js';
export function userRoutes(service: UserService) {
  const router = Router();
  router.get('/me', async (_req, res) => {
    res.json(UserProfileSchema.parse(await service.current(owner(res))));
  });
  return router;
}
