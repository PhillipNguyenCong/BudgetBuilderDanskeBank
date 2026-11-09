import { useRef, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ColorSchema } from '@budget-builder/contracts';
import type { AllocationProgress } from '@budget-builder/budget-core/allocations';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { colors, spacing } from '../../../foundation/theme/theme';
import { widgetTotal, type DraftWidget } from '../editor/draft';
import { widgetPalette } from './BudgetWidget';
import { BudgetRowEditor } from './BudgetRowEditor';
import { RolloverSettings } from './RolloverSettings';
import { AllocationGuidance } from './AllocationGuidance';

export function BudgetWidgetOverlay({
  widget,
  savings,
  progress,
  onChange,
  onAddRow,
  onClose,
}: {
  widget: DraftWidget;
  savings: DraftWidget[];
  progress: AllocationProgress;
  onChange: (widget: DraftWidget) => void;
  onAddRow: () => void;
  onClose: () => void;
}) {
  const { fontScale } = useWindowDimensions();
  const fixed = widget.type === 'FIXED_EXPENSE';
  const heading = useRef<ComponentRef<typeof View>>(null);
  const name = widget.name || 'Unnamed widget';
  const total =
    widget.type === 'FIXED_EXPENSE' && !widget.rows.some((row) => row.input.trim())
      ? 'No amounts entered'
      : widgetTotal(widget);
  const close = () => {
    Keyboard.dismiss();
    onClose();
  };
  return (
    <Modal
      testID="budget-widget-overlay"
      visible
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={close}
      onShow={() => {
        if (heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus');
      }}
    >
      <SafeAreaView
        style={[
          styles.root,
          { backgroundColor: fixed ? colors.canvas : widgetPalette[widget.color].background },
        ]}
        accessibilityViewIsModal
      >
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <View
              ref={heading}
              accessible
              accessibilityRole="header"
              accessibilityLabel={name}
              style={styles.title}
            >
              <AppText variant="heading">{name}</AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={close}
              style={styles.close}
            >
              <AppText variant="heading">×</AppText>
            </Pressable>
          </View>
          <View style={[styles.total, { backgroundColor: widgetPalette[widget.color].background }]}>
            <AppText variant="small">{fixed ? 'Set aside per month' : 'Total per month'}</AppText>
            <AppText variant="title" accessibilityLiveRegion="polite">
              {total}
            </AppText>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.content}
          >
            {widget.type === 'FIXED_EXPENSE' ? (
              <>
                <View style={styles.sectionHeading}>
                  <AppText variant="heading" accessibilityRole="header">
                    Bills
                  </AppText>
                  <AppText variant="small">
                    {widget.rows.length} {widget.rows.length === 1 ? 'bill' : 'bills'}
                  </AppText>
                </View>
                <View style={styles.billList}>
                  {fontScale <= 1.3 && widget.rows.length > 0 ? (
                    <View style={styles.columns}>
                      <AppText variant="small" style={styles.column}>
                        Bill name
                      </AppText>
                      <AppText variant="small" style={[styles.column, styles.right]}>
                        DKK / payment
                      </AppText>
                      <View style={styles.removeSpace} />
                    </View>
                  ) : null}
                  {widget.rows.length === 0 ? (
                    <AppText>No bills yet. Add a bill to plan an amount.</AppText>
                  ) : null}
                  {widget.rows.map((row, index) => (
                    <BudgetRowEditor
                      key={row.id}
                      row={row}
                      prefix={`${name} row ${index + 1}`}
                      onChange={(value) =>
                        onChange({
                          ...widget,
                          rows: widget.rows.map((item) => (item.id === row.id ? value : item)),
                        })
                      }
                      onRemove={() =>
                        onChange({
                          ...widget,
                          rows: widget.rows.filter((item) => item.id !== row.id),
                        })
                      }
                    />
                  ))}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Add bill to ${name}`}
                    accessibilityState={{ disabled: widget.rows.length >= 1000 }}
                    disabled={widget.rows.length >= 1000}
                    onPress={onAddRow}
                    style={styles.addBill}
                  >
                    <AppText variant="label">＋ Add bill</AppText>
                  </Pressable>
                </View>
                <View style={styles.guidance}>
                  <AllocationGuidance progress={progress} announce />
                </View>
              </>
            ) : null}
            <View style={styles.settings}>
              <AppText variant="small">Pot colour</AppText>
              <View style={styles.palette}>
                {ColorSchema.options.map((color) => (
                  <Pressable
                    key={color}
                    accessibilityRole="radio"
                    accessibilityLabel={`${name} color ${widgetPalette[color].name}`}
                    accessibilityState={{ checked: widget.color === color }}
                    onPress={() => onChange({ ...widget, color })}
                    style={[
                      styles.color,
                      { backgroundColor: widgetPalette[color].background },
                      widget.color === color && styles.selected,
                    ]}
                  >
                    <AppText variant="small">
                      {widget.color === color ? '✓ ' : ''}
                      {widgetPalette[color].name}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>
            <RolloverSettings widget={widget} savings={savings} onChange={onChange} />
          </ScrollView>
          <View style={styles.footer}>
            <Button label="Done" onPress={close} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.large,
    gap: spacing.medium,
  },
  total: {
    marginHorizontal: spacing.large,
    padding: spacing.large,
    borderRadius: 16,
    gap: spacing.small,
  },
  close: {
    width: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.medium,
  },
  billList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.medium,
  },
  columns: { flexDirection: 'row', gap: spacing.medium, paddingBottom: spacing.small },
  column: { flex: 1 },
  right: { textAlign: 'right' },
  removeSpace: { width: 44 },
  addBill: { minHeight: 52, justifyContent: 'center', borderTopWidth: 1, borderColor: colors.line },
  guidance: { paddingVertical: spacing.small },
  settings: {
    gap: spacing.medium,
    paddingTop: spacing.large,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  title: { flex: 1, gap: spacing.small },
  content: { padding: spacing.large, gap: spacing.medium },
  footer: {
    padding: spacing.large,
    borderTopWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
  color: {
    minHeight: 44,
    minWidth: 80,
    padding: spacing.medium,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
    justifyContent: 'center',
  },
  selected: { borderColor: colors.ink },
});
