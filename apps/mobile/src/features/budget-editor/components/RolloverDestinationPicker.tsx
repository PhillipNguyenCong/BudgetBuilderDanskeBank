import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import type { DraftWidget } from '../editor/draft';

export function RolloverDestinationPicker({
  widgetName,
  value,
  onChange,
}: {
  widgetName: string;
  value: NonNullable<DraftWidget['rollover']>;
  onChange: (value: NonNullable<DraftWidget['rollover']>) => void;
}) {
  return (
    <>
      {(['TO_NEXT_MONTH', 'TO_SAVINGS'] as const).map((destination) => (
        <Pressable
          key={destination}
          accessibilityRole="radio"
          accessibilityState={{ checked: value.destination === destination }}
          accessibilityLabel={`${widgetName}: ${destination === 'TO_SAVINGS' ? 'To savings' : 'To next month'}`}
          style={styles.option}
          onPress={() => onChange({ enabled: true, destination, targetPotId: null })}
        >
          <AppText>
            {value.destination === destination ? '✓ ' : ''}
            {destination === 'TO_SAVINGS' ? 'To a savings pot' : 'Add to next month’s spending'}
          </AppText>
        </Pressable>
      ))}
      {!value.destination ? (
        <AppText accessibilityRole="alert">Choose a rollover destination.</AppText>
      ) : null}
    </>
  );
}
const styles = StyleSheet.create({
  option: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: colors.line,
    padding: spacing.medium,
    justifyContent: 'center',
  },
});
