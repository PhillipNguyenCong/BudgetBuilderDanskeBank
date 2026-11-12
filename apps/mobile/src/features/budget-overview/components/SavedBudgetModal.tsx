import { useRef, type ComponentRef, type ReactNode } from 'react';
import { AccessibilityInfo, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../foundation/components/AppText';
import { Button } from '../../../foundation/components/Button';
import { colors, spacing } from '../../../foundation/theme/theme';

export function SavedBudgetModal({
  title,
  children,
  onClose,
  onRestoreFocus,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onRestoreFocus: () => void;
  busy?: boolean;
}) {
  const heading = useRef<ComponentRef<typeof View>>(null);
  function close() {
    if (busy) return;
    onClose();
    requestAnimationFrame(onRestoreFocus);
  }
  return (
    <Modal
      testID="saved-budget-modal"
      visible
      presentationStyle="fullScreen"
      animationType="none"
      onRequestClose={close}
      onShow={() => {
        if (heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus');
      }}
    >
      <SafeAreaView style={styles.root} accessibilityViewIsModal>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View
              style={styles.title}
              ref={heading}
              accessible
              accessibilityRole="header"
              accessibilityLabel={title}
            >
              <AppText variant="title">{title}</AppText>
            </View>
            <Button label="Close" variant="secondary" onPress={close} disabled={busy} />
          </View>
          {children}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.screen, gap: spacing.screen, paddingBottom: 40 },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.medium },
  title: { flexGrow: 1, flexBasis: '65%' },
});
