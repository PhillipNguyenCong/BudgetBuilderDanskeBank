import type { Budget, SpendingNumbers } from '@budget-builder/contracts';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import { formatDkk, typeLabels, widgetPalette } from '../../budget-shared';
import { formatGuideDkk } from './SpendingFigures';
export type SavedWidget =
  (Budget['plan']['income'] & { type: 'INCOME' }) | Budget['plan']['pots'][number];
export function SavedPotCard({
  widget,
  allocationOere,
  onOpen,
  numbers,
  guideDays = 7,
}: {
  widget: SavedWidget;
  allocationOere: number | undefined;
  onOpen: () => void;
  numbers?: SpendingNumbers | undefined;
  guideDays?: number;
}) {
  const displayed = numbers
    ? numbers.remainingOere === null
      ? undefined
      : Math.max(0, numbers.remainingOere)
    : allocationOere;
  const amount = displayed === undefined ? 'Amount unavailable' : formatDkk(displayed);
  const isFixed = widget.type === 'FIXED_EXPENSE';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${widget.name} details`}
      accessibilityValue={{
        text: `${typeLabels[widget.type]}, ${amount} ${numbers ? 'left this month' : 'planned per month'}`,
      }}
      accessibilityHint="Opens pot details and recorded activity."
      onPress={onOpen}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: widgetPalette[widget.color].background },
        pressed && styles.pressed,
      ]}
    >
      <AppText variant="heading">{widget.name}</AppText>
      <AppText>
        {typeLabels[widget.type]} ·{' '}
        {numbers ? (isFixed ? 'Left for bills' : 'Left this month') : 'Monthly plan'}
      </AppText>
      <AppText variant="title" style={styles.amount}>
        {amount}
      </AppText>
      {numbers ? (
        <>
          <AppText>
            Planned: {formatDkk(numbers.allocationOere)} · Booked:{' '}
            {formatDkk(numbers.recordedSpendingOere)}
          </AppText>
          {numbers.pendingSpendingOere !== 0 ? (
            <AppText>Pending: {formatDkk(numbers.pendingSpendingOere)}</AppText>
          ) : null}
          {numbers.unconfirmedSpendingOere !== 0 ? (
            <AppText>Unconfirmed: {formatDkk(numbers.unconfirmedSpendingOere)}</AppText>
          ) : null}
          {!isFixed ? (
            <AppText>
              {numbers.weeklyGuideDkk === null
                ? 'Weekly guide unavailable'
                : `About ${formatGuideDkk(numbers.weeklyGuideDkk)} for the next ${guideDays} ${guideDays === 1 ? 'day' : 'days'}`}
            </AppText>
          ) : null}
          {numbers.reviewAffectingCount > 0 ? (
            <AppText variant="small">
              {numbers.reviewAffectingCount}{' '}
              {numbers.reviewAffectingCount === 1 ? 'transaction needs' : 'transactions need'}{' '}
              review
            </AppText>
          ) : null}
          {numbers.overspentOere !== null && numbers.overspentOere > 0 ? (
            <AppText variant="label">
              {formatDkk(numbers.overspentOere)} over your allowance
            </AppText>
          ) : null}
        </>
      ) : null}
      <View style={styles.details}>
        <AppText variant="label">View details</AppText>
        <View style={styles.chevron} accessible={false} importantForAccessibility="no" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { padding: spacing.screen, gap: spacing.medium, borderRadius: 24, minHeight: 160 },
  pressed: { opacity: 0.75 },
  amount: { fontVariant: ['tabular-nums'] },
  details: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  chevron: {
    width: 9,
    height: 9,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.ink,
    transform: [{ rotate: '45deg' }],
    marginRight: spacing.small,
  },
});
