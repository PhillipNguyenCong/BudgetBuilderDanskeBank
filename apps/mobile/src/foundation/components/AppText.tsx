import { Text, StyleSheet, type TextProps } from 'react-native';
import { colors, fonts } from '../theme/theme';
type Props = TextProps & { variant?: 'body' | 'small' | 'label' | 'heading' | 'title' };
export function AppText({ variant = 'body', style, ...props }: Props) {
  return <Text {...props} style={[styles.base, styles[variant], style]} />;
}
const styles = StyleSheet.create({
  base: { color: colors.ink, fontFamily: fonts.regular, flexShrink: 1 },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 16, lineHeight: 24, fontFamily: fonts.semibold, fontWeight: '600' },
  heading: { fontSize: 22, lineHeight: 30, fontFamily: fonts.semibold, fontWeight: '700' },
  title: {
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
    fontFamily: fonts.semibold,
    fontWeight: '700',
  },
});
