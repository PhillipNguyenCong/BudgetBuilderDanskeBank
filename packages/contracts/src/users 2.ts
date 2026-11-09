import { z } from 'zod';
import { IdSchema } from './common.js';
export const UserProfileSchema = z.strictObject({
  id: IdSchema,
  displayName: z.string().trim().min(1).nullable(),
  isDemo: z.boolean(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;
