import { z } from 'zod';
import {
  CurrencySchema,
  IdSchema,
  IssueSchema,
  OereSchema,
  QualitySchema,
  TimestampSchema,
} from './common.js';
export const AccountSchema = z.strictObject({
  id: IdSchema,
  name: z.string(),
  currency: CurrencySchema,
  maskedIdentifier: z.string().nullable(),
  bookedBalanceOere: OereSchema.nullable(),
  availableBalanceOere: OereSchema.nullable(),
  updatedAt: TimestampSchema.nullable(),
  issues: z.array(IssueSchema),
});
export type Account = z.infer<typeof AccountSchema>;
export const AccountListSchema = z.strictObject({
  items: z.array(AccountSchema),
  quality: QualitySchema,
});
