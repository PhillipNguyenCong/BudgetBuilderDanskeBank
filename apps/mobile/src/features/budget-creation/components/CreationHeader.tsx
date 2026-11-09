import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../foundation/components/AppText';
import { spacing } from '../../../foundation/theme/theme';

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
        style={styles.info}
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
  info: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  link: { textDecorationLine: 'underline' },
});
