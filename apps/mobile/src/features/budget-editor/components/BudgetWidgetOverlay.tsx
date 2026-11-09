import type { AllocationProgress } from '@budget-builder/budget-core/allocations';
import { useRef, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../foundation/components/Button';
import { colors, spacing } from '../../../foundation/theme/theme';
import { widgetPalette } from '../../budget-shared';
import { widgetTotal, type DraftWidget } from '../editor/draft';
import { useBillFocus } from '../hooks/useBillFocus';
import { AllocationGuidance } from './AllocationGuidance';
import { BillList } from './BillList';
import { RolloverSettings } from './RolloverSettings';
import { WidgetColorPicker } from './WidgetColorPicker';
import { WidgetOverlayHeader } from './WidgetOverlayHeader';
import { WidgetOverlayTotal } from './WidgetOverlayTotal';

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
  const fixed = widget.type === 'FIXED_EXPENSE';
  const billFocus = useBillFocus(widget.rows, fixed);
  const heading = useRef<ComponentRef<typeof View>>(null);
  const name = widget.name || 'Unnamed widget';
  const total =
    widget.type === 'FIXED_EXPENSE' && !widget.rows.some((row) => row.input.trim())
      ? 'No amounts entered'
      : widgetTotal(widget);
  const close = () => {
    billFocus.dismiss();
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
          <WidgetOverlayHeader name={name} heading={heading} onClose={close} />
          <WidgetOverlayTotal widget={widget} total={total} />
          <ScrollView
            ref={billFocus.scroll}
            onContentSizeChange={billFocus.reveal}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.content}
          >
            {widget.type === 'FIXED_EXPENSE' ? (
              <>
                <BillList
                  widget={widget}
                  onChange={onChange}
                  onAddRow={onAddRow}
                  focus={billFocus}
                />
                <View style={styles.guidance}>
                  <AllocationGuidance progress={progress} announce />
                </View>
              </>
            ) : null}
            <WidgetColorPicker widget={widget} onChange={onChange} />
            <RolloverSettings widget={widget} savings={savings} onChange={onChange} />
          </ScrollView>
          <View style={styles.footer}>
            {fixed && billFocus.active?.field === 'name' ? (
              <Button
                label="Next"
                onPress={() => billFocus.focus(billFocus.active!.rowId, 'amount')}
              />
            ) : fixed && (billFocus.active || billFocus.keyboardVisible) ? (
              <Button label="OK" onPress={billFocus.dismiss} />
            ) : (
              <Button label="Done" onPress={close} />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  guidance: { paddingVertical: spacing.small },
  content: { padding: spacing.large, gap: spacing.medium },
  footer: {
    padding: spacing.large,
    borderTopWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
});
