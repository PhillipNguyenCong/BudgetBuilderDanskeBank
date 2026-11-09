import { readFile } from 'node:fs/promises';
import { normalizeDataset } from '@budget-builder/budget-core';
import type { NormalizedDataset } from '@budget-builder/budget-core';
import type { BankDataProvider } from './bank-data-provider.js';
import { demoData } from './demo-data.js';
export interface JsonProviderOptions {
  path?: string;
  ownerId?: string;
  asOf?: Date;
  load?: () => Promise<unknown>;
}
export class JsonBankDataProvider implements BankDataProvider {
  private loaded: Promise<NormalizedDataset> | undefined;
  private readonly ownerId: string;
  constructor(private readonly options: JsonProviderOptions = {}) {
    this.ownerId = options.ownerId ?? 'demo-user';
  }
  private async data(ownerId: string): Promise<NormalizedDataset | null> {
    if (ownerId !== this.ownerId) return null;
    this.loaded ??= this.load();
    return structuredClone(await this.loaded);
  }
  async listAccounts(ownerId: string) {
    const data = await this.data(ownerId);
    return data ? { items: [data.account], quality: data.quality } : null;
  }
  async getSnapshot(ownerId: string, accountId: string) {
    const data = await this.data(ownerId);
    return data?.account.id === accountId ? data : null;
  }
  private async load(): Promise<NormalizedDataset> {
    const raw: unknown = this.options.load
      ? await this.options.load()
      : this.options.path
        ? JSON.parse(await readFile(this.options.path, 'utf8'))
        : demoData;
    const generated =
      typeof raw === 'object' && raw !== null
        ? (raw as { meta?: { generatedAt?: unknown } }).meta?.generatedAt
        : undefined;
    const asOf = this.options.asOf ?? (typeof generated === 'string' ? new Date(generated) : null);
    if (!asOf) throw new Error('Dataset cutoff must be supplied explicitly or in metadata.');
    return normalizeDataset(raw, this.ownerId, asOf);
  }
}
