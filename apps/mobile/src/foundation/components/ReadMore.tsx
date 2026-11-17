import { useRef, useState, useEffect, type ComponentRef, type ReactNode } from 'react';
import { AccessibilityInfo, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { Button } from './Button';
import { colors, spacing } from '../theme/theme';

export function ReadMore({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<ComponentRef<typeof View>>(null);
  const heading = useRef<ComponentRef<typeof View>>(null);
  const pendingFocus = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (pendingFocus.current !== null) cancelAnimationFrame(pendingFocus.current);
    },
    [],
  );
  function restoreFocus() {
    if (trigger.current) AccessibilityInfo.sendAccessibilityEvent(trigger.current, 'focus');
  }
  function close() {
    setOpen(false);
    pendingFocus.current = requestAnimationFrame(restoreFocus);
  }
  return (
    <>
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel="Read more"
        accessibilityHint={title}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={styles.link}
      >
        <AppText style={styles.label}>Read more</AppText>
      </Pressable>
      {open ? (
        <Modal
          testID="read-more-overlay"
          visible
          presentationStyle="fullScreen"
          animationType="slide"
          onRequestClose={close}
          onDismiss={restoreFocus}
          onShow={() => {
            if (heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus');
          }}
        >
          <SafeAreaView style={styles.root} accessibilityViewIsModal>
            <View style={styles.header}>
              <View
                ref={heading}
                accessible
                accessibilityRole="header"
                accessibilityLabel={title}
                style={styles.title}
              >
                <AppText variant="heading">{title}</AppText>
              </View>
              <Button label="Close" variant="secondary" onPress={close} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
          </SafeAreaView>
        </Modal>
      ) : null}
    </>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    padding: spacing.large,
  },
  title: { flex: 1 },
  content: { padding: spacing.large, gap: spacing.medium },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  label: { color: colors.blue, textDecorationLine: 'underline' },
});
