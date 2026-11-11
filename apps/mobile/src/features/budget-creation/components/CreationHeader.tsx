import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { colors, spacing } from '../../../foundation/theme/theme';

export function CreationHeader({ busy, onInfo }: { busy: boolean; onInfo: () => void }) {
  return (
    <View style={styles.header}>
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        Create your budget
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More info"
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
          More info
        </AppText>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.medium },
  title: { flex: 1 },
  info: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: colors.tint,
    borderWidth: 1,
    borderColor: colors.blue,
  },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.4 },
  link: { color: colors.blue, fontWeight: '700' },
});
