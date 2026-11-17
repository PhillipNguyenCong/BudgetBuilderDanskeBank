import type { Budget } from '@budget-builder/contracts';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { Card } from '../../../foundation/components/Card';
import { spacing } from '../../../foundation/theme/theme';
import { formatDkk, typeLabels, widgetPalette } from '../../budget-shared';
import { SavedPlanningRow } from './SavedPlanningRow';
import type { SavedWidget } from './SavedPotCard';

export function SavedPotDetails({
  widget,
  allocationOere,
  pots,
}: {
  widget: SavedWidget;
  allocationOere: number | undefined;
  pots: Budget['plan']['pots'];
}) {
  const rollover = 'rollover' in widget ? widget.rollover : undefined;
  const label =
    widget.type === 'INCOME'
      ? 'Monthly income'
      : widget.type === 'FIXED_EXPENSE'
        ? 'Set aside per month'
        : 'Monthly allocation';
  return (
    <View style={styles.rows}>
      <Card
        style={{
          backgroundColor:
            widgetPalette[widget.type === 'SAVINGS' ? 'MINT' : widget.color].background,
        }}
      >
        <AppText variant="label">{typeLabels[widget.type]}</AppText>
        <AppText variant="heading">
          {label}: {allocationOere === undefined ? 'Amount unavailable' : formatDkk(allocationOere)}
        </AppText>
      </Card>
      <View style={styles.rows}>
        <AppText variant="heading" accessibilityRole="header">
          {widget.type === 'FIXED_EXPENSE' ? 'Bills' : 'Planning rows'}
        </AppText>
        {widget.rows.length ? (
          widget.rows.map((row) => (
            <SavedPlanningRow key={row.id} row={row} fixed={widget.type === 'FIXED_EXPENSE'} />
          ))
        ) : (
          <AppText>No rows in this pot.</AppText>
        )}
      </View>
      {rollover ? (
        <Card>
          <AppText variant="label">
            Rollover preference:{' '}
            {rollover.enabled
              ? rollover.destination === 'TO_NEXT_MONTH'
                ? 'next month’s spending'
                : `to ${pots.find((pot) => pot.id === rollover.targetPotId)?.name ?? 'unavailable savings target'}`
              : 'off'}
          </AppText>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ rows: { gap: spacing.large } });
