import { Pressable, StyleSheet } from 'react-native';
import type { Account } from '@budget-builder/contracts';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
export function AccountOption({
  account,
  selected,
  unavailable,
  onSelect,
}: {
  account: Account;
  selected: boolean;
  unavailable: boolean;
  onSelect: () => void;
}) {
  const identifier = account.maskedIdentifier ?? 'Account number unavailable';
  const balance =
    account.availableBalanceOere === null
      ? 'Available balance unknown'
      : `Available: ${new Intl.NumberFormat('en-DK', { style: 'currency', currency: account.currency }).format(account.availableBalanceOere / 100)}`;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${account.name}, ${identifier}`}
      accessibilityState={{ checked: selected, disabled: unavailable }}
      accessibilityHint={
        unavailable ? 'This account already has a budget.' : 'Select this account for your budget.'
      }
      disabled={unavailable}
      onPress={onSelect}
      style={[styles.card, selected && styles.selected]}
    >
      <AppText variant="label">{account.name}</AppText>
      <AppText variant="small">{identifier}</AppText>
      <AppText>{balance}</AppText>
      {unavailable ? (
        <AppText variant="small">Already used by a budget</AppText>
      ) : selected ? (
        <AppText variant="label">Selected</AppText>
      ) : null}
      {account.issues.length > 0 ? (
        <AppText variant="small">Some account details are incomplete or uncertain.</AppText>
      ) : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    minHeight: 44,
    padding: spacing.large,
    gap: spacing.small,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  selected: { borderColor: colors.blue },
});
