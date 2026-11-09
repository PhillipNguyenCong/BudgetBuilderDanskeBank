import { z } from 'zod';
export const IdSchema = z.string().trim().min(1).max(128);
export const NameSchema = z.string().trim().min(1).max(100);
export const OereSchema = z
  .number()
  .int()
  .min(-Number.MAX_SAFE_INTEGER)
  .max(Number.MAX_SAFE_INTEGER);
export const NonNegativeOereSchema = OereSchema.nonnegative();
export const DateSchema = z.iso.date();
export const TimestampSchema = z.iso.datetime({ offset: true });
export const CurrencySchema = z.string().regex(/^[A-Z]{3}$/);
export const DirectionSchema = z.enum(['DEBIT', 'CREDIT', 'UNKNOWN']);
export const IssueSchema = z.strictObject({
  code: z.string(),
  field: z.string().nullable(),
  severity: z.enum(['WARNING', 'ERROR']),
  message: z.string(),
});
export type DataIssue = z.infer<typeof IssueSchema>;
export const QualitySchema = z.strictObject({
  asOf: TimestampSchema,
  coverage: z.strictObject({
    from: DateSchema.nullable(),
    to: DateSchema.nullable(),
    completeMonths: z.number().int().nonnegative(),
  }),
  duplicatesRemoved: z.number().int().nonnegative(),
  issues: z.array(IssueSchema),
});
export const SourceSchema = z.strictObject({
  kind: z.enum(['USER', 'SUGGESTED']),
  explanation: z.string().max(1000),
  recordIds: z.array(IdSchema).max(100),
  period: z.strictObject({ from: DateSchema, to: DateSchema }).nullable(),
});
export const ErrorSchema = z.strictObject({
  error: z.strictObject({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    fields: z.array(z.strictObject({ path: z.string(), message: z.string() })).optional(),
  }),
});
export const PageQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
    from: DateSchema.optional(),
    to: DateSchema.optional(),
  })
  .strict()
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: 'from must not be after to',
    path: ['from'],
  });
export type PageQuery = z.infer<typeof PageQuerySchema>;
export const PageSchema = z.strictObject({
  limit: z.number().int(),
  offset: z.number().int(),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});
export const pageOf = <T extends z.ZodType>(item: T) =>
  z.strictObject({ items: z.array(item), page: PageSchema, quality: QualitySchema });
