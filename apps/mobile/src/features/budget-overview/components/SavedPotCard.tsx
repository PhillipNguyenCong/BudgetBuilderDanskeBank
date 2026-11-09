import type { Budget } from '@budget-builder/contracts';
import { AppText } from '../../../foundation/components/AppText';
import { Card } from '../../../foundation/components/Card';
import { widgetPalette } from '../../budget-shared';
import { SavedPlanningRow } from './SavedPlanningRow';
export type SavedWidget =
  (Budget['plan']['income'] & { type: 'INCOME' }) | Budget['plan']['pots'][number];
export function SavedPotCard({
  widget,
  pots,
}: {
  widget: SavedWidget;
  pots: Budget['plan']['pots'];
}) {
  const rollover = 'rollover' in widget ? widget.rollover : undefined;
  return (
    <Card style={{ backgroundColor: widgetPalette[widget.color].background }}>
      <AppText variant="heading" accessibilityRole="header">
        {widget.name}
      </AppText>
      <AppText variant="small">
        {widget.type === 'INCOME'
          ? 'Income'
          : widget.type === 'SAVINGS'
            ? 'Savings allocation'
            : widget.type === 'SPENDING'
              ? 'Spending allocation'
              : 'Fixed-expense allocation'}
      </AppText>
      {widget.rows.length ? (
        widget.rows.map((row) => (
          <SavedPlanningRow key={row.id} row={row} fixed={widget.type === 'FIXED_EXPENSE'} />
        ))
      ) : (
        <AppText>No rows in this pot.</AppText>
      )}
      {rollover ? (
        <AppText variant="small">
          Rollover preference:{' '}
          {rollover.enabled
            ? rollover.destination === 'TO_NEXT_MONTH'
              ? 'next month’s spending'
              : `to ${pots.find((pot) => pot.id === rollover?.targetPotId)?.name ?? 'unavailable savings target'}`
            : 'off'}
          . Month-end processing is not implemented yet.
        </AppText>
      ) : null}
    </Card>
  );
}
