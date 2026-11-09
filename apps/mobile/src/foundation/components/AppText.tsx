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
  label: { fontSize: 16, lineHeight: 24, fontFamily: fonts.semibold },
  heading: { fontSize: 20, lineHeight: 28, fontFamily: fonts.semibold },
  title: { fontSize: 28, lineHeight: 36, fontFamily: fonts.semibold },
});
