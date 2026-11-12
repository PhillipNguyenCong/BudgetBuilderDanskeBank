import { z } from 'zod';
import {
  CurrencySchema,
  DateSchema,
  DirectionSchema,
  IdSchema,
  IssueSchema,
  NonNegativeOereSchema,
  pageOf,
} from './common.js';
export const OriginalMoneySchema = z.strictObject({
  amount: z.string().nullable(),
  currency: CurrencySchema.nullable(),
});
export const TransactionSchema = z.strictObject({
  id: IdSchema,
  sourceId: z.string().nullable(),
  accountId: IdSchema,
  date: DateSchema.nullable(),
  dateBasis: z.enum(['BOOKED_ON', 'VALUE_DATE', 'UNKNOWN']),
  direction: DirectionSchema,
  status: z.enum(['BOOKED', 'PENDING', 'CANCELLED', 'UNKNOWN']),
  amountOere: NonNegativeOereSchema.nullable(),
  original: OriginalMoneySchema,
  conversionBasis: z.enum(['ACCOUNT_AMOUNT', 'DKK_AMOUNT', 'FX_RATE', 'UNAVAILABLE']),
  text: z.string(),
  counterparty: z.string().nullable(),
  issues: z.array(IssueSchema),
  transferEvidence: z.enum(['EXPLICIT_INTERNAL_TRANSFER', 'SAME_ACCOUNT']).nullable().optional(),
});
export type Transaction = z.infer<typeof TransactionSchema>;
export const TransactionPageSchema = pageOf(TransactionSchema);
