import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { spacing, colors } from '../theme/theme';
export function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: spacing.medium }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <AppText variant="label" style={{ color: colors.blue }}>
          {label}
        </AppText>
      </Pressable>
      {open ? children : null}
    </View>
  );
}
