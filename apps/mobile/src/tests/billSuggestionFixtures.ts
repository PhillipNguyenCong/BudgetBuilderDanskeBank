import type { BillSuggestions } from '@budget-builder/contracts';
export function billSuggestions(): BillSuggestions {
  return {
    accountId: 'demo-account',
    snapshotDate: '2026-09-03',
    quality: {
      asOf: '2026-09-03T12:00:00Z',
      coverage: { from: '2026-07-01', to: '2026-09-03', completeMonths: 2 },
      duplicatesRemoved: 0,
      issues: [],
    },
    notes: ['Only two complete months are available.'],
    suggestions: [
      {
        id: 'found-rent',
        label: 'Rent',
        amountOere: 800000,
        frequency: 'MONTHLY',
        confidence: 'RECURRING',
        match: { merchantKeys: ['known:rent'] },
        source: {
          kind: 'SUGGESTED',
          explanation:
            'Two eligible monthly rent payments found. Review before creating your budget.',
          recordIds: ['rent-july', 'rent-august'],
          period: { from: '2026-07-01', to: '2026-09-03' },
        },
      },
      {
        id: 'found-netflix',
        label: 'Netflix',
        amountOere: 9900,
        frequency: 'MONTHLY',
        confidence: 'RECURRING',
        match: { merchantKeys: ['known:netflix'] },
        source: {
          kind: 'SUGGESTED',
          explanation: 'Two monthly Netflix payments found. Review before creating your budget.',
          recordIds: ['netflix-july', 'netflix-august'],
          period: { from: '2026-07-01', to: '2026-09-03' },
        },
      },
    ],
  };
}
