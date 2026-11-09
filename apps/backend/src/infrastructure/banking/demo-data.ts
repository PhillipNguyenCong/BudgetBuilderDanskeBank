// Independently authored synthetic fixture, not the supplied banking dataset.
export const demoData = {
  meta: { generatedAt: '2026-09-03T12:00:00Z', period: { from: '2026-07-01', to: '2026-09-03' } },
  account: {
    id: 'demo-account',
    name: 'Everyday account',
    currency: 'DKK',
    accountNumber: '0000001234',
    bookedBalance: { value: '18000.00', currency: 'DKK' },
    availableBalance: { value: '17800.00', currency: 'DKK' },
    lastUpdated: '2026-09-03T12:00:00Z',
  },
  transactions: {
    isSuccess: true,
    items: [
      {
        id: 'demo-t1',
        bookedOn: '2026-08-31',
        direction: 'CREDIT',
        amount: { value: 24000, currency: 'DKK' },
        status: 'BOOKED',
        originalTransactionText: 'Salary',
      },
      {
        id: 'demo-t2',
        bookedOn: '2026-09-01',
        direction: 'DEBIT',
        amount: { value: -9000, currency: 'DKK' },
        status: 'BOOKED',
        originalTransactionText: 'Rent',
      },
    ],
  },
  payments: {
    isSuccess: true,
    items: [
      {
        paymentId: 'demo-p1',
        transactionDate: '2026-09-15',
        direction: 'DEBIT',
        amount: 500,
        amountCurrency: 'DKK',
        statusMessage: 'Scheduled',
        isRecurring: true,
        textOnSendersAccountStatement: 'Utilities',
      },
    ],
  },
};
