import type { BankDataProvider } from '../../infrastructure/banking/bank-data-provider.js';
import type { PageQuery } from '@budget-builder/contracts';
import { notFound } from '../../shared/errors.js';
import { discoverBills } from '@budget-builder/budget-core';
export class AccountService {
  constructor(private readonly provider: BankDataProvider) {}
  async list(ownerId: string) {
    const data = await this.provider.listAccounts(ownerId);
    if (!data) throw notFound();
    return data;
  }
  async snapshot(ownerId: string, accountId: string) {
    const data = await this.provider.getSnapshot(ownerId, accountId);
    if (!data || data.ownerId !== ownerId || data.account.id !== accountId) throw notFound();
    return data;
  }
  async transactions(ownerId: string, accountId: string, q: PageQuery) {
    const data = await this.snapshot(ownerId, accountId);
    return page(data.transactions, q, (t) => t.date, data.quality);
  }
  async billSuggestions(ownerId: string, accountId: string) {
    const data = await this.snapshot(ownerId, accountId);
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Copenhagen',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(data.quality.asOf));
    const value = (type: string) => parts.find((part) => part.type === type)!.value;
    const cutoff = `${value('year')}-${value('month')}-${value('day')}`;
    const date =
      data.quality.coverage.to && data.quality.coverage.to < cutoff
        ? data.quality.coverage.to
        : cutoff;
    return {
      accountId,
      snapshotDate: date,
      quality: data.quality,
      ...discoverBills({
        accountId,
        transactions: data.transactions,
        payments: data.payments,
        date,
        coverage: data.quality.coverage,
      }),
    };
  }
  async payments(ownerId: string, accountId: string, q: PageQuery) {
    const data = await this.snapshot(ownerId, accountId);
    return page(data.payments, q, (p) => p.expectedDate, data.quality);
  }
}
function page<T extends { id: string }>(
  items: T[],
  q: PageQuery,
  date: (item: T) => string | null,
  quality: Awaited<ReturnType<AccountService['snapshot']>>['quality'],
) {
  const sorted = items
    .filter((item) => {
      const d = date(item);
      return (!q.from && !q.to) || (d !== null && (!q.from || d >= q.from) && (!q.to || d <= q.to));
    })
    .sort(
      (a, b) => (date(a) ?? '9999').localeCompare(date(b) ?? '9999') || a.id.localeCompare(b.id),
    );
  if ((q.from || q.to) && items.some((item) => date(item) === null))
    quality = {
      ...quality,
      issues: [
        ...quality.issues,
        {
          code: 'UNDATED_RECORDS_FILTERED',
          field: null,
          severity: 'WARNING',
          message: 'Records without a reliable date are omitted from this date-filtered result.',
        },
      ],
    };
  return {
    items: sorted.slice(q.offset, q.offset + q.limit),
    page: {
      limit: q.limit,
      offset: q.offset,
      total: sorted.length,
      hasMore: q.offset + q.limit < sorted.length,
    },
    quality,
  };
}
