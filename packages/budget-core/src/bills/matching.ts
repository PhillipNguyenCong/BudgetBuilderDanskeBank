import type { Transaction } from '@budget-builder/contracts';
const normalized = (value: string) =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
export function knownMerchant(text: string): 'Netflix' | 'Rent' | null {
  const value = ` ${normalized(text)} `;
  if (value.includes(' netflix ')) return 'Netflix';
  if (
    value.includes(' husleje ') ||
    /^\s*rent(?:\s|$)/.test(normalized(text)) ||
    value.includes(' boligleje ')
  )
    return 'Rent';
  return null;
}
type Movement = Pick<Transaction, 'text' | 'counterparty'>;
export function billMerchantKeys(record: Movement): string[] {
  const known = knownMerchant(`${record.text} ${record.counterparty ?? ''}`);
  const payee = normalized(record.counterparty ?? '');
  const description = normalized(record.text)
    .replace(
      /\b(?:january|february|march|april|may|june|july|august|september|october|november|december|januar|februar|marts|maj|juni|juli|oktober|november|december|\d{4,})\b/g,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();
  return [
    ...new Set([
      ...(known ? [`known:${known.toLowerCase()}`] : []),
      ...(payee ? [`payee:${payee}`] : []),
      ...(!known && description ? [`description:${description}`] : []),
    ]),
  ].filter((key) => key.length <= 200);
}
export function billMatchScore(record: Movement, match: { merchantKeys: string[] }): number {
  const keys = billMerchantKeys(record);
  const payees = keys.filter((key) => key.startsWith('payee:'));
  const savedPayees = match.merchantKeys.filter((key) => key.startsWith('payee:'));
  const sharedKnownMerchant = keys.some(
    (key) => key.startsWith('known:') && key !== 'known:rent' && match.merchantKeys.includes(key),
  );
  if (
    payees.length &&
    savedPayees.length &&
    !payees.some((key) => savedPayees.includes(key)) &&
    !sharedKnownMerchant
  )
    return 0;
  return keys.reduce(
    (score, key) =>
      match.merchantKeys.includes(key)
        ? Math.max(score, key.startsWith('payee:') ? 3 : key === 'known:rent' ? 1 : 2)
        : score,
    0,
  );
}

// Generic descriptions and Rent aliases do not identify different named payees.
export function billIdentityKeys(match: { merchantKeys: string[] }): string[] {
  const known = match.merchantKeys.filter(
    (key) => key.startsWith('known:') && key !== 'known:rent',
  );
  if (known.length) return known;
  const payees = match.merchantKeys.filter((key) => key.startsWith('payee:'));
  return payees.length ? payees : match.merchantKeys;
}
