import type { SpendingNumbers } from '@budget-builder/contracts';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { Card } from '../../../foundation/components/Card';
import { colors, spacing } from '../../../foundation/theme/theme';
import { formatDkk } from '../../budget-shared';
export const formatGuideDkk = (amount: number) =>
  `DKK ${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
export function SpendingFigures({
  numbers,
  daysRemaining,
  breakdown = false,
  kind = 'SPENDING',
}: {
  numbers: SpendingNumbers;
  daysRemaining: number;
  breakdown?: boolean;
  kind?: 'SPENDING' | 'FIXED_EXPENSE';
}) {
  const available = numbers.remainingOere === null ? null : Math.max(0, numbers.remainingOere);
  return (
    <View style={styles.stack}>
      <Card style={styles.primary}>
        <AppText variant="heading" accessibilityRole="header">
          {kind === 'FIXED_EXPENSE' ? 'Left for bills this month' : 'Left to spend this month'}
        </AppText>
        <AppText variant="title" style={styles.amount}>
          {available === null ? 'Unavailable' : formatDkk(available)}
        </AppText>
        {numbers.overspentOere !== null && numbers.overspentOere > 0 ? (
          <AppText variant="label">{formatDkk(numbers.overspentOere)} over your allowance</AppText>
        ) : null}
        {kind === 'SPENDING' ? (
          <>
            <AppText variant="label">
              {numbers.weeklyGuideDkk === null
                ? 'Weekly guide unavailable'
                : `About ${formatGuideDkk(numbers.weeklyGuideDkk)} for the next ${Math.min(7, daysRemaining)} ${Math.min(7, daysRemaining) === 1 ? 'day' : 'days'}`}
            </AppText>
            <AppText>
              {numbers.dailyGuideDkk === null
                ? 'Daily guide unavailable'
                : `About ${formatGuideDkk(numbers.dailyGuideDkk)} per day`}{' '}
              · {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
            </AppText>
            <AppText variant="small">
              Spending guidance, not an account balance or enforced card limit.
            </AppText>
          </>
        ) : (
          <AppText variant="small">
            Fixed-expense progress, not a reserved bank balance or a claim that future bills are
            covered.
          </AppText>
        )}
        {!breakdown ? (
          <>
            <AppText>Booked so far: {formatDkk(numbers.recordedSpendingOere)}</AppText>
            {numbers.pendingSpendingOere > 0 ? (
              <AppText>Pending commitments: {formatDkk(numbers.pendingSpendingOere)}</AppText>
            ) : null}
            {numbers.unconfirmedSpendingOere > 0 ? (
              <AppText>
                Unconfirmed commitments: {formatDkk(numbers.unconfirmedSpendingOere)}
              </AppText>
            ) : null}
          </>
        ) : null}
      </Card>
      {numbers.limitations.map((message) => (
        <AppText key={message} accessibilityRole="alert">
          {message}
        </AppText>
      ))}
      {breakdown ? (
        <Card>
          <AppText>Monthly allocation: {formatDkk(numbers.allocationOere)}</AppText>
          <AppText>Carried in: {formatDkk(numbers.carriedInOere)}</AppText>
          <AppText>Booked: {formatDkk(numbers.recordedSpendingOere)}</AppText>
          <AppText>Pending commitments: {formatDkk(numbers.pendingSpendingOere)}</AppText>
          <AppText>Unconfirmed commitments: {formatDkk(numbers.unconfirmedSpendingOere)}</AppText>
          <AppText variant="small">
            Remaining = allocation + carried in − booked − pending − unconfirmed. Confirmed refunds
            restore the selected pot.
          </AppText>
        </Card>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  stack: { gap: spacing.medium },
  primary: { backgroundColor: colors.tint },
  amount: { fontVariant: ['tabular-nums'] },
});
