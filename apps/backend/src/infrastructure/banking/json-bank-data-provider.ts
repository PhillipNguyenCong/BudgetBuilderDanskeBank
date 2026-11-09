import { readFile } from 'node:fs/promises';
import { normalizeDataset } from '@budget-builder/budget-core';
import type { NormalizedDataset } from '@budget-builder/budget-core';
import type { BankDataProvider } from './bank-data-provider.js';
import { UserProfileSchema, type UserProfile } from '@budget-builder/contracts';
import { AppError } from '../../shared/errors.js';
import { demoData } from './demo-data.js';
export interface JsonProviderOptions {
  path?: string;
  ownerId?: string;
  asOf?: Date;
  load?: () => Promise<unknown>;
}
export class JsonBankDataProvider implements BankDataProvider {
  private loaded: Promise<{ dataset: NormalizedDataset; profile: UserProfile }> | undefined;
  private readonly ownerId: string;
  constructor(private readonly options: JsonProviderOptions = {}) {
    this.ownerId = options.ownerId ?? 'demo-user';
  }
  private async data(
    ownerId: string,
  ): Promise<{ dataset: NormalizedDataset; profile: UserProfile } | null> {
    if (ownerId !== this.ownerId) return null;
    this.loaded ??= this.load().catch(() => {
      throw new AppError(
        503,
        'BANK_DATA_UNAVAILABLE',
        'Bank data is unavailable. Check the local data configuration and restart the backend.',
      );
    });
    return structuredClone(await this.loaded);
  }
  async getProfile(ownerId: string) {
    return (await this.data(ownerId))?.profile ?? null;
  }
  async listAccounts(ownerId: string) {
    const data = (await this.data(ownerId))?.dataset;
    return data ? { items: [data.account], quality: data.quality } : null;
  }
  async getSnapshot(ownerId: string, accountId: string) {
    const data = (await this.data(ownerId))?.dataset;
    return data?.account.id === accountId ? data : null;
  }
  private async load(): Promise<{ dataset: NormalizedDataset; profile: UserProfile }> {
    const raw: unknown = this.options.load
      ? await this.options.load()
      : this.options.path
        ? JSON.parse(await readFile(this.options.path, 'utf8'))
        : demoData;
    if (
      !raw ||
      typeof raw !== 'object' ||
      Array.isArray(raw) ||
      !('account' in raw) ||
      !raw.account ||
      typeof raw.account !== 'object' ||
      Array.isArray(raw.account)
    ) {
      throw new Error('Invalid dataset structure.');
    }
    const ownerName = (raw.account as { ownerName?: unknown }).ownerName;
    const profile = UserProfileSchema.parse({
      id: this.ownerId,
      displayName: typeof ownerName === 'string' && ownerName.trim() ? ownerName.trim() : null,
      isDemo: true,
    });
    const generated =
      typeof raw === 'object' && raw !== null
        ? (raw as { meta?: { generatedAt?: unknown } }).meta?.generatedAt
        : undefined;
    const asOf = this.options.asOf ?? (typeof generated === 'string' ? new Date(generated) : null);
    if (!asOf) throw new Error('Dataset cutoff must be supplied explicitly or in metadata.');
    return { dataset: normalizeDataset(raw, this.ownerId, asOf), profile };
  }
}
