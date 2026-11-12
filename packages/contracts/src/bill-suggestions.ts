import { z } from 'zod';
import { BillFrequencySchema, BillMatchSchema } from './budgets.js';
import {
  DateSchema,
  IdSchema,
  NameSchema,
  NonNegativeOereSchema,
  QualitySchema,
  SourceSchema,
} from './common.js';
export const BillSuggestionSchema = z.strictObject({
  id: IdSchema,
  label: NameSchema,
  amountOere: NonNegativeOereSchema.nullable(),
  frequency: BillFrequencySchema.nullable(),
  confidence: z.enum(['RECURRING', 'POSSIBLE']),
  match: BillMatchSchema,
  source: SourceSchema,
});
export type BillSuggestion = z.infer<typeof BillSuggestionSchema>;
export const BillSuggestionsSchema = z.strictObject({
  accountId: IdSchema,
  snapshotDate: DateSchema,
  quality: QualitySchema,
  suggestions: z.array(BillSuggestionSchema).max(100),
  notes: z.array(z.string()),
});
export type BillSuggestions = z.infer<typeof BillSuggestionsSchema>;
