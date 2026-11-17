import { useEffect, useRef, type ComponentRef, type RefObject } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import { BackButton } from '../../../foundation/components/BackButton';
import { AppText } from '../../../foundation/components/AppText';
import { colors } from '../../../foundation/theme/theme';

export function CreationHeader({
  busy,
  title = 'Create budget',
  onInfo,
  infoRef,
  onBack,
  accountLabel,
}: {
  title?: string;
  busy: boolean;
  accountLabel?: string;
  onBack: () => void;
  onInfo: () => void;
  infoRef?: RefObject<ComponentRef<typeof View> | null>;
}) {
  const heading = useRef<ComponentRef<typeof View>>(null);
  const previousTitle = useRef(title);
  useEffect(() => {
    if (previousTitle.current === title) return;
    previousTitle.current = title;
    const frame = requestAnimationFrame(() => {
      if (heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus');
    });
    return () => cancelAnimationFrame(frame);
  }, [title]);
  return (
    <View style={styles.header}>
      <BackButton plain disabled={busy} onPress={onBack} />
      <View style={styles.titleGroup}>
        <View ref={heading} accessible accessibilityRole="header" accessibilityLabel={title}>
          <AppText variant="heading" style={styles.title}>
            {title}
          </AppText>
        </View>
        {accountLabel ? (
          <AppText variant="small" style={styles.account}>
            {accountLabel}
          </AppText>
        ) : null}
      </View>
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
        <View style={styles.infoMark} accessible={false}>
          <AppText style={styles.link} accessible={false} maxFontSizeMultiplier={1}>
            i
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: -8 },
  titleGroup: { flex: 1, gap: 2 },
  account: { fontSize: 12, lineHeight: 16, color: colors.muted },
  title: { fontSize: 20, lineHeight: 26 },
  info: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderRadius: 22,
  },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.4 },
  infoMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { color: colors.blue, fontWeight: '700', fontSize: 14, lineHeight: 18 },
});
