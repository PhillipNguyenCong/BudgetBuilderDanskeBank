import type { BankDataProvider } from '../../infrastructure/banking/bank-data-provider.js';
import { notFound } from '../../shared/errors.js';
export class UserService {
  constructor(private readonly bank: BankDataProvider) {}
  async current(ownerId: string) {
    const profile = await this.bank.getProfile(ownerId);
    if (!profile || profile.id !== ownerId) throw notFound();
    return profile;
  }
}
