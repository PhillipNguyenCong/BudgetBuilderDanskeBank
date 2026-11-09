import { z } from 'zod';
import {
  IdSchema,
  NameSchema,
  NonNegativeOereSchema,
  OereSchema,
  SourceSchema,
  TimestampSchema,
} from './common.js';
export const ColorSchema = z.enum(['OCEAN', 'SKY', 'MINT', 'LAVENDER', 'SAND', 'ROSE']);
export const BudgetRowSchema = z.strictObject({
  id: IdSchema,
  label: NameSchema,
  amountOere: NonNegativeOereSchema,
  source: SourceSchema.optional(),
});
const widget = {
  id: IdSchema,
  name: NameSchema,
  color: ColorSchema,
  rows: z.array(BudgetRowSchema).max(1000),
};
export const IncomeSchema = z.strictObject(widget);
export const RolloverSchema = z.strictObject({
  enabled: z.boolean(),
  destination: z.enum(['TO_SAVINGS', 'TO_NEXT_MONTH']).nullable(),
  targetPotId: IdSchema.nullable(),
});
export const PotSchema = z.discriminatedUnion('type', [
  z.strictObject({ ...widget, type: z.literal('SPENDING'), rollover: RolloverSchema }),
  z.strictObject({ ...widget, type: z.literal('FIXED_EXPENSE') }),
  z.strictObject({ ...widget, type: z.literal('SAVINGS') }),
]);
export const BudgetPlanSchema = z
  .strictObject({
    name: NameSchema,
    income: IncomeSchema,
    pots: z.array(PotSchema).min(1).max(100),
  })
  .superRefine((plan, ctx) => {
    const ids = new Set<string>();
    const check = (id: string, path: (string | number)[]) => {
      if (ids.has(id))
        ctx.addIssue({ code: 'custom', path, message: 'IDs must be unique within a budget' });
      ids.add(id);
    };
    check(plan.income.id, ['income', 'id']);
    plan.income.rows.forEach((r, i) => check(r.id, ['income', 'rows', i, 'id']));
    plan.pots.forEach((p, i) => {
      check(p.id, ['pots', i, 'id']);
      p.rows.forEach((r, j) => check(r.id, ['pots', i, 'rows', j, 'id']));
      if (p.type !== 'SPENDING') return;
      const r = p.rollover,
        path = ['pots', i, 'rollover'];
      if (r.enabled && !r.destination)
        ctx.addIssue({ code: 'custom', path, message: 'Enabled rollover needs a destination' });
      if (
        r.destination === 'TO_SAVINGS' &&
        !plan.pots.some((t) => t.id === r.targetPotId && t.type === 'SAVINGS')
      )
        ctx.addIssue({
          code: 'custom',
          path,
          message: 'Savings target must be a Savings pot in this budget',
        });
      if (r.destination !== 'TO_SAVINGS' && r.targetPotId !== null)
        ctx.addIssue({
          code: 'custom',
          path,
          message: 'Target is only valid for savings rollover',
        });
    });
  });
export type BudgetPlan = z.infer<typeof BudgetPlanSchema>;
export const CreateBudgetSchema = z.strictObject({ accountId: IdSchema, plan: BudgetPlanSchema });
export const UpdateBudgetSchema = z.strictObject({
  expectedRevision: z.number().int().positive(),
  plan: BudgetPlanSchema,
});
export const BudgetTotalsSchema = z.strictObject({
  incomeOere: NonNegativeOereSchema,
  allocatedOere: NonNegativeOereSchema,
  unallocatedOere: OereSchema,
  pots: z.array(z.strictObject({ id: IdSchema, allocationOere: NonNegativeOereSchema })),
});
export type BudgetTotals = z.infer<typeof BudgetTotalsSchema>;
export const BudgetSchema = z.strictObject({
  id: IdSchema,
  accountId: IdSchema,
  revision: z.number().int().positive(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  plan: BudgetPlanSchema,
  totals: BudgetTotalsSchema,
});
export type Budget = z.infer<typeof BudgetSchema>;
export const BudgetListSchema = z.strictObject({ items: z.array(BudgetSchema) });
