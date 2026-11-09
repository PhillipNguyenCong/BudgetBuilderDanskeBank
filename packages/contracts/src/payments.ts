import { z } from 'zod';
import {
  DateSchema,
  DirectionSchema,
  IdSchema,
  IssueSchema,
  NonNegativeOereSchema,
  pageOf,
} from './common.js';
import { OriginalMoneySchema } from './transactions.js';
export const PlannedPaymentSchema = z.strictObject({
  id: IdSchema,
  sourceId: z.string().nullable(),
  accountId: IdSchema,
  expectedDate: DateSchema.nullable(),
  direction: DirectionSchema,
  status: z.enum(['SCHEDULED', 'CANCELLED', 'PENDING', 'UNKNOWN']),
  amountOere: NonNegativeOereSchema.nullable(),
  original: OriginalMoneySchema,
  conversionBasis: z.enum(['ACCOUNT_AMOUNT', 'DKK_AMOUNT', 'FX_RATE', 'UNAVAILABLE']),
  recurring: z.boolean().nullable(),
  text: z.string(),
  counterparty: z.string().nullable(),
  issues: z.array(IssueSchema),
});
export type PlannedPayment = z.infer<typeof PlannedPaymentSchema>;
export const PaymentPageSchema = pageOf(PlannedPaymentSchema);
