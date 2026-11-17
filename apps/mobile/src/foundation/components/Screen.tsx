import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardFieldProvider, useKeyboardField } from './KeyboardFieldEditor';
import { KeyboardDoneBar } from './KeyboardDoneBar';
import { BankHeader } from './BankHeader';
import { colors, spacing } from '../theme/theme';
type Props = ViewProps & { contentStyle?: StyleProp<ViewStyle>; scrollResetKey?: string };
export function Screen(props: Props) {
  return (
    <KeyboardFieldProvider>
      <ScreenContent {...props} />
    </KeyboardFieldProvider>
  );
}
function ScreenContent({ children, contentStyle, scrollResetKey }: Props) {
  const editor = useKeyboardField();
  const [viewport, setViewport] = useState({ top: 0, height: 0 });
  const offset = useRef(0);
  const pending = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [scrollResetKey]);
  const visibleHeight = Math.max(
    0,
    Math.min(
      viewport.height,
      (editor?.visibleBottom ?? viewport.top + viewport.height) - viewport.top,
    ),
  );
  const measure = useCallback(
    () =>
      scroll.current?.measureInWindow((_x, top, _width, height) => {
        setViewport((previous) =>
          previous.top === top && previous.height === height ? previous : { top, height },
        );
      }),
    [],
  );
  const activeSource = editor?.active?.source;
  const reveal = useCallback(() => {
    if (!activeSource) return;
    if (pending.current !== null) cancelAnimationFrame(pending.current);
    pending.current = requestAnimationFrame(() => {
      pending.current = null;
      activeSource.current?.measureInWindow((_x, top, _width, height) => {
        const safeTop = viewport.top + 16;
        const safeBottom = viewport.top + visibleHeight - 24;
        const delta =
          top + height > safeBottom ? top + height - safeBottom : top < safeTop ? top - safeTop : 0;
        if (visibleHeight > 0 && Math.abs(delta) > 4)
          scroll.current?.scrollTo({ y: Math.max(0, offset.current + delta), animated: true });
      });
    });
  }, [activeSource, viewport.top, visibleHeight]);
  useEffect(() => {
    reveal();
    return () => {
      if (pending.current !== null) cancelAnimationFrame(pending.current);
    };
  }, [reveal]);
  return (
    <View style={styles.root}>
      <BankHeader />
      <SafeAreaView edges={['left', 'right']} style={styles.root}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            ref={scroll}
            onLayout={measure}
            onScroll={(event) => {
              offset.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            onContentSizeChange={reveal}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={false}
            contentContainerStyle={[
              styles.content,
              contentStyle,
              editor?.active && {
                paddingBottom: 56 + Math.max(0, viewport.height - visibleHeight),
              },
            ]}
          >
            {children}
          </ScrollView>
          <KeyboardDoneBar />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.screen, gap: spacing.large, paddingBottom: 32, flexGrow: 1 },
});
