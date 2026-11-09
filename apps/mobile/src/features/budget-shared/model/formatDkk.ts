export function formatDkk(amountOere: number): string {
  const signed = BigInt(amountOere);
  const amount = signed < 0n ? -signed : signed;
  const whole = String(amount / 100n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = amount % 100n;
  return `DKK ${signed < 0n ? '-' : ''}${whole}${fraction ? `.${String(fraction).padStart(2, '0')}` : ''}`;
}
