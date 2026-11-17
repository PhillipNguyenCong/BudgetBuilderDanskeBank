import type { AllocationProgress } from '@budget-builder/budget-core/allocations';
import { useRef, type ComponentRef, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../foundation/components/Button';
import { colors, spacing } from '../../../foundation/theme/theme';
import { widgetPalette } from '../../budget-shared';
import { widgetTotal, type DraftWidget } from '../editor/draft';
import { useBillFocus } from '../hooks/useBillFocus';
import { AllocationGuidance } from './AllocationGuidance';
import { BillList } from './BillList';
import { WidgetOverlayHeader } from './WidgetOverlayHeader';
import { WidgetOverlayTotal } from './WidgetOverlayTotal';

export function BudgetWidgetOverlay({
  widget,
  progress,
  onChange,
  onAddRow,
  onClose,
  suggestionPanel,
  onAmountBlur,
}: {
  widget: DraftWidget;
  savings: DraftWidget[];
  progress: AllocationProgress;
  onChange: (widget: DraftWidget) => void;
  onAddRow: () => void;
  onClose: () => void;
  suggestionPanel?: ReactNode;
  onAmountBlur: (rowId: string) => void;
}) {
  const { fontScale } = useWindowDimensions();
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
      <SafeAreaProvider>
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
            {fontScale <= 1.3 && !billFocus.active && !billFocus.keyboardVisible ? (
              <WidgetOverlayTotal widget={widget} total={total} />
            ) : null}
            <ScrollView
              ref={billFocus.scroll}
              onContentSizeChange={billFocus.reveal}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.content}
            >
              {fontScale > 1.3 ? <WidgetOverlayTotal widget={widget} total={total} /> : null}
              {widget.type === 'FIXED_EXPENSE' ? (
                <>
                  <BillList
                    widget={widget}
                    onChange={onChange}
                    onAddRow={onAddRow}
                    focus={billFocus}
                    onAmountBlur={onAmountBlur}
                  />
                  {suggestionPanel}
                  <View style={styles.guidance}>
                    <AllocationGuidance progress={progress} announce />
                  </View>
                </>
              ) : null}
            </ScrollView>
            <View style={styles.footer}>
              {fixed && billFocus.active?.field === 'name' ? (
                <Button
                  label="Next"
                  maxFontSizeMultiplier={2}
                  onPress={() => billFocus.focus(billFocus.active!.rowId, 'amount')}
                />
              ) : fixed && (billFocus.active || billFocus.keyboardVisible) ? (
                <Button label="OK" maxFontSizeMultiplier={2} onPress={billFocus.dismiss} />
              ) : (
                <Button label="Done" maxFontSizeMultiplier={2} onPress={close} />
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
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
