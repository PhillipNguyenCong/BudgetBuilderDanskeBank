import { z } from 'zod';
import { DateSchema, IdSchema, NonNegativeOereSchema } from './common.js';
export const SalarySuggestionSchema = z.strictObject({
  accountId: IdSchema,
  snapshotDate: DateSchema,
  suggestion: z
    .strictObject({
      amountOere: NonNegativeOereSchema,
      paymentDate: DateSchema,
      transactionId: IdSchema,
    })
    .nullable(),
  explanation: z.string(),
});
export type SalarySuggestion = z.infer<typeof SalarySuggestionSchema>;
