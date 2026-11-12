import type { Budget, ClassifiedTransaction } from '@budget-builder/contracts';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import { formatDkk } from '../../budget-shared';
export function ActivityList({
  items,
  budget,
  onOpen,
  emptyLabel = 'No recorded transactions in this view.',
}: {
  items: ClassifiedTransaction[];
  budget: Budget;
  onOpen?: (item: ClassifiedTransaction) => void;
  emptyLabel?: string;
}) {
  return (
    <View style={styles.list}>
      {!items.length ? <AppText>{emptyLabel}</AppText> : null}
      {items.map((item) => {
        const tx = item.transaction;
        const content = (
          <>
            <AppText variant="label">{tx.text}</AppText>
            <AppText>
              {tx.amountOere === null
                ? 'Amount unavailable'
                : `${tx.direction === 'DEBIT' ? '− ' : tx.direction === 'CREDIT' ? '+ ' : ''}${formatDkk(tx.amountOere)}`}
            </AppText>
            <AppText variant="small">
              {tx.date ?? 'Date unknown'} · {tx.status} ·{' '}
              {item.kind === 'UNKNOWN' ? 'Uncertain classification' : item.kind.toLowerCase()}
            </AppText>
            {item.contribution !== 'NONE' ? (
              <AppText variant="small">
                {item.contribution === 'BOOKED'
                  ? 'Included as booked spending'
                  : item.contribution === 'PENDING'
                    ? 'Included as a pending commitment'
                    : 'Included conservatively as unconfirmed'}
              </AppText>
            ) : null}
            <AppText variant="small">
              {item.potId
                ? (budget.plan.pots.find((p) => p.id === item.potId)?.name ?? 'Unavailable pot')
                : 'Account activity'}{' '}
              · {item.origin === 'CUSTOMER' ? 'Confirmed by you' : 'Automatic'}
            </AppText>
            {item.exclusionReason ? (
              <AppText variant="small">{item.exclusionReason}</AppText>
            ) : null}
            {tx.issues.length ? (
              <AppText variant="small">
                {tx.issues.length} source data notes · View classification for details
              </AppText>
            ) : null}
            {onOpen ? (
              <AppText variant="label" style={styles.link}>
                View classification
              </AppText>
            ) : null}
          </>
        );
        return onOpen ? (
          <Pressable
            key={tx.id}
            accessibilityRole="button"
            accessibilityLabel={`View ${tx.text} classification`}
            accessibilityValue={{
              text: `${tx.date ?? 'Date unknown'}, ${tx.direction.toLowerCase()}, ${tx.amountOere === null ? 'Amount unavailable' : formatDkk(tx.amountOere)}, ${tx.status.toLowerCase()}`,
            }}
            accessibilityHint="Opens the classification explanation and optional correction."
            onPress={() => onOpen(item)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            {content}
          </Pressable>
        ) : (
          <View key={tx.id} style={styles.row}>
            {content}
          </View>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  list: { gap: spacing.medium },
  row: {
    padding: spacing.large,
    minHeight: 44,
    backgroundColor: colors.white,
    borderRadius: 20,
    gap: spacing.small,
  },
  link: { color: colors.blue },
  pressed: { opacity: 0.75 },
});
