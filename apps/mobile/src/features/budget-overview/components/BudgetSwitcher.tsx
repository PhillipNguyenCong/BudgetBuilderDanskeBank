import type { Budget } from '@budget-builder/contracts';
import { useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';
import { SavedBudgetModal } from './SavedBudgetModal';

export function BudgetSwitcher({
  budgets,
  selectedId,
  onSelect,
}: {
  budgets: Budget[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<ComponentRef<typeof View>>(null);
  const selected = budgets.find((budget) => budget.id === selectedId);
  function restoreFocus() {
    if (trigger.current) AccessibilityInfo.sendAccessibilityEvent(trigger.current, 'focus');
  }
  return (
    <>
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel="Choose budget"
        accessibilityValue={{ text: selected?.plan.name ?? 'No budget selected' }}
        accessibilityState={{ expanded: open }}
        accessibilityElementsHidden={open}
        importantForAccessibility={open ? 'no-hide-descendants' : 'auto'}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <AppText variant="label" style={styles.blue}>
          Choose budget
        </AppText>
        <AppText>{selected?.plan.name ?? 'Select a saved budget'}</AppText>
      </Pressable>
      {open ? (
        <SavedBudgetModal
          title="Choose budget"
          onClose={() => setOpen(false)}
          onRestoreFocus={restoreFocus}
        >
          <View accessibilityRole="radiogroup" style={styles.options}>
            {budgets.map((budget) => {
              const current = budget.id === selectedId;
              return (
                <Pressable
                  key={budget.id}
                  accessibilityRole="radio"
                  accessibilityLabel={budget.plan.name}
                  accessibilityState={{ checked: current }}
                  onPress={() => {
                    setOpen(false);
                    onSelect(budget.id);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    current && styles.selected,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText variant="heading">{budget.plan.name}</AppText>
                  <AppText>{current ? 'Selected' : 'Select budget'}</AppText>
                </Pressable>
              );
            })}
          </View>
        </SavedBudgetModal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.blue,
    padding: spacing.large,
    gap: spacing.small,
    backgroundColor: colors.tint,
  },
  blue: { color: colors.blue },
  options: { gap: spacing.medium },
  option: {
    minHeight: 56,
    padding: spacing.screen,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.small,
  },
  selected: { borderColor: colors.blue, backgroundColor: colors.tint },
  pressed: { opacity: 0.75 },
});
