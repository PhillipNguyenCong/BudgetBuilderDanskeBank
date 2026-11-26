import { inferCarExpenseKind } from '@budget-builder/budget-core/allocations';
import type { CarExpenseKind } from '@budget-builder/contracts';
import { draftRow, parseAmount, type Draft, type DraftRow } from './draft';

const categories: { kind: CarExpenseKind; label: string; description: string; reserve: boolean }[] =
  [
    {
      kind: 'VEHICLE_TAX',
      label: 'Vehicle tax / ejerafgift',
      reserve: false,
      description:
        'Use your vehicle tax amount and payment frequency. The applicable tax depends on your vehicle.',
    },
    {
      kind: 'INSURANCE',
      label: 'Car insurance',
      reserve: false,
      description: 'Use the amount on your car insurance bill.',
    },
    {
      kind: 'FUEL',
      label: 'Fuel / charging',
      reserve: true,
      description: 'Enter the monthly amount you want to set aside for fuel or charging.',
    },
    {
      kind: 'MAINTENANCE',
      label: 'Service / repairs',
      reserve: true,
      description: 'A monthly reserve for servicing and unexpected repairs, not a monthly bill.',
    },
    {
      kind: 'TYRES',
      label: 'Tyre changes',
      reserve: true,
      description: 'A monthly reserve for seasonal tyre changes or storage, not a monthly bill.',
    },
    {
      kind: 'INSPECTION',
      label: 'Vehicle inspection / syn',
      reserve: true,
      description:
        'Enter a monthly reserve, not the inspection fee. No fee or inspection date is assumed.',
    },
  ];
export type CarChecklistItem = (typeof categories)[number] & {
  include: boolean;
  existingRows: DraftRow[];
  row: DraftRow;
};

export function createCarChecklist(draft: Draft): CarChecklistItem[] {
  const rows = draft.widgets
    .filter((widget) => widget.type === 'FIXED_EXPENSE')
    .flatMap((widget) => widget.rows);
  const used = new Set(
    draft.widgets.flatMap((widget) => [widget.id, ...widget.rows.map((row) => row.id)]),
  );
  return categories.map((category) => {
    const base = `car-${category.kind.toLowerCase()}`;
    let id = base;
    let suffix = 1;
    while (used.has(id)) id = `${base}-${suffix++}`;
    used.add(id);
    return {
      ...category,
      include: true,
      existingRows: rows.filter((row) => inferCarExpenseKind(row) === category.kind),
      row: {
        ...draftRow({
          id,
          label: `${category.label}${category.reserve ? ' reserve' : ''}`,
          amountOere: 0,
          frequency: 'MONTHLY',
          carExpense: {
            kind: category.kind,
            basis: category.reserve ? 'MONTHLY_RESERVE' : 'PAYMENT',
          },
          source: {
            kind: 'USER',
            recordIds: [],
            period: null,
            explanation: category.reserve
              ? `User-entered monthly reserve for ${category.label}. This is a planning allocation, not an observed payment or payment schedule.`
              : `User-entered ${category.label} payment amount and frequency; no price was estimated.`,
          },
        }),
        input: '',
        originalInput: '',
      },
    };
  });
}

export function applyCarChecklist(draft: Draft, items: CarChecklistItem[]): Draft {
  const fixed = draft.widgets.find((widget) => widget.type === 'FIXED_EXPENSE');
  if (!fixed) throw new Error('A Fixed expenses widget is needed for car costs.');
  const edited = new Map(items.flatMap((item) => item.existingRows).map((row) => [row.id, row]));
  for (const row of edited.values()) {
    if (parseAmount(row).amount === undefined)
      throw new Error(
        `Enter the amount for ${row.label}. Existing bills remain included until removed in Fixed expenses.`,
      );
  }
  const additions = items
    .filter((item) => !item.existingRows.length && item.include)
    .map((item) => {
      if (parseAmount(item.row).amount === undefined)
        throw new Error(
          `Enter an amount for ${item.label}, or choose Skip this cost. Blank amounts are not zero.`,
        );
      return item.row;
    });
  if (fixed.rows.length + additions.length > 1000)
    throw new Error('There are too many bills. Review your bill list before adding car costs.');
  return {
    ...draft,
    widgets: draft.widgets.map((widget) =>
      widget.type === 'FIXED_EXPENSE'
        ? {
            ...widget,
            rows: [
              ...widget.rows.map((row) => {
                const current = edited.get(row.id) ?? row;
                const kind = inferCarExpenseKind(current);
                return !kind || current.carExpense
                  ? current
                  : { ...current, carExpense: { kind, basis: 'PAYMENT' as const } };
              }),
              ...(widget.id === fixed.id ? additions : []),
            ],
          }
        : widget,
    ),
  };
}
