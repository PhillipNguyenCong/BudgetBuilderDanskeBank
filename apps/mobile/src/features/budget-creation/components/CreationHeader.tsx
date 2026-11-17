import type { ComponentRef, RefObject } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BackButton } from '../../../foundation/components/BackButton';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';

export function CreationHeader({
  busy,
  onInfo,
  infoRef,
  onBack,
}: {
  busy: boolean;
  onBack: () => void;
  onInfo: () => void;
  infoRef?: RefObject<ComponentRef<typeof View> | null>;
}) {
  return (
    <View style={styles.header}>
      <BackButton disabled={busy} onPress={onBack} />
      <AppText variant="heading" accessibilityRole="header" style={styles.title}>
        Create budget
      </AppText>
      <Pressable
        ref={infoRef}
        accessibilityRole="button"
        accessibilityLabel="Read more"
        disabled={busy}
        accessibilityState={{ disabled: busy }}
        style={({ pressed }) => [
          styles.info,
          busy && styles.disabled,
          pressed && !busy && styles.pressed,
        ]}
        onPress={onInfo}
      >
        <AppText variant="small" style={styles.link}>
          Read more
        </AppText>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.medium },
  title: { flex: 1, fontSize: 20, lineHeight: 26 },
  info: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: 22,
  },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.4 },
  link: { color: colors.blue, fontWeight: '700' },
});
