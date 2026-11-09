import { View, Switch, Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import type { DraftWidget } from '../editor/draft';

export function RolloverSettings({
  widget,
  savings,
  onChange,
}: {
  widget: DraftWidget;
  savings: DraftWidget[];
  onChange: (widget: DraftWidget) => void;
}) {
  if (widget.type !== 'SPENDING' || !widget.rollover) return null;
  const value = widget.rollover;
  const set = (rollover: NonNullable<DraftWidget['rollover']>) => onChange({ ...widget, rollover });
  return (
    <View style={styles.content}>
      <AppText variant="label">Month-end preference</AppText>
      <AppText variant="small">
        Optional. Your choice is saved, but automatic month-end processing is not available in this
        prototype yet.
      </AppText>
      <View style={styles.toggle}>
        <AppText>Automatic rollover</AppText>
        <Switch
          accessibilityLabel={`${widget.name} automatic rollover`}
          value={value.enabled}
          onValueChange={(enabled) =>
            set(
              !enabled &&
                (!value.destination || (value.destination === 'TO_SAVINGS' && !value.targetPotId))
                ? { enabled: false, destination: null, targetPotId: null }
                : { ...value, enabled },
            )
          }
        />
      </View>
      {value.enabled ? (
        <>
          {(['TO_NEXT_MONTH', 'TO_SAVINGS'] as const).map((destination) => (
            <Pressable
              key={destination}
              accessibilityRole="radio"
              accessibilityState={{ checked: value.destination === destination }}
              accessibilityLabel={`${widget.name}: ${destination === 'TO_SAVINGS' ? 'To savings' : 'To next month'}`}
              style={styles.option}
              onPress={() => set({ enabled: true, destination, targetPotId: null })}
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
          {value.destination === 'TO_SAVINGS' ? (
            <>
              <AppText variant="small">Choose a savings pot in this budget.</AppText>
              {savings.map((pot) => (
                <Pressable
                  key={pot.id}
                  style={styles.option}
                  accessibilityRole="radio"
                  accessibilityLabel={`${widget.name} savings target ${pot.name}`}
                  accessibilityState={{ checked: value.targetPotId === pot.id }}
                  onPress={() => set({ ...value, targetPotId: pot.id })}
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
          ) : null}
        </>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  content: {
    gap: spacing.medium,
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingTop: spacing.large,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.medium,
  },
  option: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: colors.line,
    padding: spacing.medium,
    justifyContent: 'center',
  },
});
