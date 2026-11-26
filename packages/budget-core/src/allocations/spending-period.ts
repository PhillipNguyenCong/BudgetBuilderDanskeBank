import { DateSchema, NonNegativeOereSchema } from '@budget-builder/contracts';

export function remainingDays(date: string): number {
  DateSchema.parse(date);
  const day = new Date(`${date}T00:00:00Z`);
  const end = new Date(day);
  end.setUTCMonth(day.getUTCMonth() + 1, 0);
  return end.getUTCDate() - day.getUTCDate() + 1;
}

/** Round a non-negative allowance directly from integer oere to whole DKK. */
export function periodShareDkk(amountOere: bigint, days: number, periodDays: number) {
  const denominator = BigInt(days * 100);
  return Number((amountOere * BigInt(periodDays) + denominator / 2n) / denominator);
}

export function plannedWeeklyDkk(monthlyOere: number, month: string): number {
  NonNegativeOereSchema.parse(monthlyOere);
  return periodShareDkk(BigInt(monthlyOere), remainingDays(`${month}-01`), 7);
}
