import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import type { DraftWidget } from '../editor/draft';

export function RolloverSavingsTarget({
  widgetName,
  value,
  savings,
  onChange,
}: {
  widgetName: string;
  value: NonNullable<DraftWidget['rollover']>;
  savings: DraftWidget[];
  onChange: (value: NonNullable<DraftWidget['rollover']>) => void;
}) {
  return (
    <>
      <AppText variant="small">Choose a savings pot in this budget.</AppText>
      {savings.map((pot) => (
        <Pressable
          key={pot.id}
          style={styles.option}
          accessibilityRole="radio"
          accessibilityLabel={`${widgetName} savings target ${pot.name}`}
          accessibilityState={{ checked: value.targetPotId === pot.id }}
          onPress={() => onChange({ ...value, targetPotId: pot.id })}
        >
          <AppText>
            {value.targetPotId === pot.id ? '✓ ' : ''}
            {pot.name || 'Unnamed savings pot'}
          </AppText>
        </Pressable>
      ))}
      {!savings.some((pot) => pot.id === value.targetPotId) ? (
        <AppText accessibilityRole="alert">Select a savings pot, or add one first.</AppText>
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
