import type { SpendingSummary } from '@budget-builder/contracts';
export const monthLabel = (month: string) =>
  new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${month}-01T00:00:00Z`),
  );
export const isHistorical = (summary: SpendingSummary) =>
  summary.month <
  (summary.currentMonth ??
    summary.availableMonths?.at(-1) ??
    summary.sourceSnapshotDate?.slice(0, 7) ??
    summary.month);
export const creationMonth = (createdAt: string) => {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date(createdAt));
  return `${parts.find((part) => part.type === 'year')!.value}-${parts.find((part) => part.type === 'month')!.value}`;
};
