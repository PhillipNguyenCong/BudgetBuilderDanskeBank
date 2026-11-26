import type { CarExpenseKind } from '@budget-builder/contracts';

const aliases: Record<CarExpenseKind, readonly string[]> = {
  VEHICLE_TAX: [
    'vehicle tax',
    'ejerafgift',
    'grøn ejerafgift',
    'co2 ejerafgift',
    'vægtafgift',
    'miljøafgift',
  ],
  INSURANCE: ['car insurance', 'motor insurance', 'bilforsikring'],
  FUEL: ['fuel', 'ev charging', 'brændstof', 'benzin', 'diesel', 'opladning'],
  MAINTENANCE: ['car service', 'car repairs', 'bilservice', 'bilreparation', 'bilreparationer'],
  TYRES: [
    'tyre changes',
    'tyre change',
    'tire change',
    'dækskift',
    'hjulskift',
    'vinterhjul',
    'sommerhjul',
  ],
  INSPECTION: ['vehicle inspection', 'car inspection', 'bilsyn', 'periodisk syn', 'syn'],
};
const phrase = (text: string) =>
  text
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/** Checklist hints only: generic insurance/services and ambiguous labels remain unclassified. */
export function inferCarExpenseKind(row: {
  label: string;
  carExpense?: { kind: CarExpenseKind; basis: 'PAYMENT' | 'MONTHLY_RESERVE' } | undefined;
}): CarExpenseKind | null {
  if (row.carExpense) return row.carExpense.kind;
  const label = ` ${phrase(row.label)} `;
  const found = (Object.keys(aliases) as CarExpenseKind[]).filter((kind) =>
    aliases[kind].some((alias) => label.includes(` ${phrase(alias)} `)),
  );
  return found.length === 1 ? found[0]! : null;
}
