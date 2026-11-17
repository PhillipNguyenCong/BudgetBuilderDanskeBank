import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors } from '../../../foundation/theme/theme';
import type { DraftWidget } from '../editor/draft';
import { RolloverSavingsTarget } from './RolloverSavingsTarget';

type Rule = NonNullable<DraftWidget['rollover']>;
const options = [
  {
    value: 'TO_SAVINGS',
    label: 'Add to savings',
    description: 'Allocate the remainder to a savings pot.',
  },
  {
    value: 'TO_NEXT_MONTH',
    label: 'Add to next month’s Budget',
    description: 'Increase next month’s allowance.',
  },
  {
    value: 'NONE',
    label: 'Keep unallocated',
    description: 'Leave the remainder outside your allocations.',
  },
] as const;

export function RolloverRule({
  widget,
  savings,
  onChange,
  showName,
}: {
  widget: DraftWidget;
  savings: DraftWidget[];
  onChange: (widget: DraftWidget) => void;
  showName: boolean;
}) {
  const value = widget.rollover ?? { enabled: false, destination: null, targetPotId: null };
  const selected = value.enabled ? value.destination : 'NONE';
  const set = (rule: Rule) => onChange({ ...widget, rollover: rule });
  return (
    <View style={styles.group}>
      {showName ? <AppText variant="label">{widget.name}</AppText> : null}
      {options.map((option) => {
        const disabled = option.value === 'TO_SAVINGS' && savings.length === 0;
        const checked = selected === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={`${widget.name}: ${option.label}`}
            accessibilityState={{ checked, disabled }}
            disabled={disabled}
            style={({ pressed }) => [
              styles.option,
              checked && styles.selected,
              disabled && styles.disabled,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
              if (option.value === 'NONE')
                set({ enabled: false, destination: null, targetPotId: null });
              else if (option.value === 'TO_NEXT_MONTH')
                set({ enabled: true, destination: 'TO_NEXT_MONTH', targetPotId: null });
              else
                set({
                  enabled: true,
                  destination: 'TO_SAVINGS',
                  targetPotId: savings.some((p) => p.id === value.targetPotId)
                    ? value.targetPotId
                    : savings.length === 1
                      ? savings[0]!.id
                      : null,
                });
            }}
          >
            <View style={[styles.radio, checked && styles.radioSelected]} accessible={false}>
              {checked ? <View style={styles.dot} /> : null}
            </View>
            <View style={styles.text}>
              <AppText variant="label">{option.label}</AppText>
              <AppText variant="small" style={styles.description}>
                {option.description}
              </AppText>
            </View>
          </Pressable>
        );
      })}
      {savings.length === 0 ? (
        <AppText variant="small">No savings pot is available in this budget.</AppText>
      ) : null}
      {value.enabled && !value.destination ? (
        <AppText accessibilityRole="alert">Choose a rollover rule.</AppText>
      ) : null}
      {value.enabled &&
      value.destination === 'TO_SAVINGS' &&
      savings.length === 1 &&
      value.targetPotId === savings[0]?.id ? (
        <AppText variant="small">Savings destination: {savings[0].name}</AppText>
      ) : null}
      {value.enabled &&
      value.destination === 'TO_SAVINGS' &&
      (savings.length !== 1 || value.targetPotId !== savings[0]?.id) ? (
        <RolloverSavingsTarget
          widgetName={widget.name}
          value={value}
          savings={savings}
          onChange={set}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: 8 },
  option: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
  },
  selected: { borderColor: colors.blue, backgroundColor: colors.tint },
  disabled: { opacity: 0.5 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.blue },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue },
  text: { flex: 1, gap: 2 },
  description: { color: colors.muted },
});
