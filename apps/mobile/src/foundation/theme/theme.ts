import { Platform } from 'react-native';

export const colors = {
  navy: '#182548',
  blue: '#334DDB',
  ink: '#202334',
  muted: '#626575',
  canvas: '#F5F5F7',
  white: '#FFFFFF',
  line: '#DDDDE5',
  disabled: '#E6E6EE',
  tint: '#ECEEFF',
};
export const spacing = { small: 4, medium: 12, large: 16, screen: 24 };
export const fonts = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }),
  semibold: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'system-ui' }),
};
