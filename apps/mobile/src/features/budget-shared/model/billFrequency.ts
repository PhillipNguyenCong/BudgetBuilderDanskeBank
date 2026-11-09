import type { BillFrequency } from '@budget-builder/contracts';
export const billFrequencyLabels: Record<BillFrequency, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Every 6 months',
  YEARLY: 'Yearly',
};
