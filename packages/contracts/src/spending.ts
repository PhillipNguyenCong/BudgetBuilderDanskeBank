import { z } from 'zod';
import { AccountSchema } from './accounts.js';
import { BudgetSchema } from './budgets.js';
import {
  DateSchema,
  IdSchema,
  NonNegativeOereSchema,
  OereSchema,
  PageSchema,
  QualitySchema,
  TimestampSchema,
} from './common.js';
import { TransactionSchema } from './transactions.js';

export const MovementKindSchema = z.enum(['EXPENSE', 'TRANSFER', 'CREDIT', 'REFUND', 'UNKNOWN']);
export const TransactionDecisionSchema = z
  .strictObject({
    kind: MovementKindSchema,
    potId: IdSchema.nullable(),
  })
  .superRefine((value, ctx) => {
    if ((value.kind === 'EXPENSE' || value.kind === 'REFUND') !== (value.potId !== null))
      ctx.addIssue({
        code: 'custom',
        message: 'Expenses and refunds require one pot; other movements have no pot.',
      });
  });
export type TransactionDecision = z.infer<typeof TransactionDecisionSchema>;
export const TransactionCorrectionSchema = z.strictObject({
  transactionId: IdSchema,
  revision: z.number().int().positive(),
  decision: TransactionDecisionSchema.nullable(),
  updatedAt: TimestampSchema,
});
export type TransactionCorrection = z.infer<typeof TransactionCorrectionSchema>;
export const CorrectTransactionSchema = z.strictObject({
  expectedRevision: z.number().int().nonnegative(),
  expectedBudgetRevision: z.number().int().positive(),
  decision: TransactionDecisionSchema.nullable(),
});
export const ClassifiedTransactionSchema = z.strictObject({
  billRowId: IdSchema.nullable().optional(),
  transaction: TransactionSchema,
  kind: MovementKindSchema,
  potId: IdSchema.nullable(),
  origin: z.enum(['AUTO', 'CUSTOMER']),
  reason: z.string(),
  correctionRevision: z.number().int().nonnegative(),
  included: z.boolean(),
  contribution: z.enum(['BOOKED', 'PENDING', 'UNCONFIRMED', 'NONE']),
  exclusionReason: z.string().nullable(),
  needsReview: z.boolean(),
});
export type ClassifiedTransaction = z.infer<typeof ClassifiedTransactionSchema>;
export const SpendingNumbersSchema = z.strictObject({
  allocationOere: NonNegativeOereSchema,
  carriedInOere: NonNegativeOereSchema,
  recordedSpendingOere: OereSchema,
  pendingSpendingOere: NonNegativeOereSchema,
  unconfirmedSpendingOere: NonNegativeOereSchema,
  reviewAffectingCount: z.number().int().nonnegative(),
  remainingOere: OereSchema.nullable(),
  overspentOere: NonNegativeOereSchema.nullable(),
  weeklyGuideDkk: z.number().int().nonnegative().nullable(),
  dailyGuideDkk: z.number().int().nonnegative().nullable(),
  limitations: z.array(z.string()),
});
export type SpendingNumbers = z.infer<typeof SpendingNumbersSchema>;
export const SpendingSummarySchema = z.strictObject({
  budget: BudgetSchema,
  account: AccountSchema,
  snapshotDate: DateSchema,
  month: z.string().regex(/^\d{4}-\d{2}$/),
  daysRemaining: z.number().int().min(1).max(31),
  mode: z.literal('SOURCE_SNAPSHOT'),
  snapshotVersion: z.string().regex(/^[a-f0-9]{64}$/),
  quality: QualitySchema,
  defaultSpendingPotId: IdSchema.nullable(),
  retainedCorrectionCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  overall: SpendingNumbersSchema,
  pots: z.array(z.strictObject({ potId: IdSchema, numbers: SpendingNumbersSchema })),
  fixedExpenses: z.array(z.strictObject({ potId: IdSchema, numbers: SpendingNumbersSchema })),
  recent: z.array(ClassifiedTransactionSchema),
});
export type SpendingSummary = z.infer<typeof SpendingSummarySchema>;
export const ActivityQuerySchema = z.strictObject({
  expectedSnapshotVersion: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
  potId: IdSchema.optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .refine((m) => DateSchema.safeParse(`${m}-01`).success)
    .optional(),
});
export const BudgetActivitySchema = z.strictObject({
  budgetRevision: z.number().int().positive(),
  snapshotVersion: z.string().regex(/^[a-f0-9]{64}$/),
  snapshotDate: DateSchema,
  items: z.array(ClassifiedTransactionSchema),
  page: PageSchema,
});
