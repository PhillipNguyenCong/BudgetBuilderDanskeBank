import {
createContext,
useCallback,
useContext,
useEffect,
useRef,
useState,
type ComponentRef,
type ReactNode,
type RefObject,
} from 'react';
import {
Keyboard,
Platform,
Pressable,
StyleSheet,
TextInput,
View,
useWindowDimensions,
type KeyboardEvent,
type TextInputProps,
} from 'react-native';
import { AppText } from './AppText';
import { colors, fonts } from '../theme/theme';

type EditingField = {
source: RefObject<ComponentRef<typeof TextInput> | null>;
id: string;
label: string;
value: string;
suffix?: string;
error?: string;
input: Pick<
TextInputProps,
| 'keyboardType'
| 'maxLength'
| 'placeholder'
| 'autoCapitalize'
| 'autoCorrect'
| 'secureTextEntry'

> ;
> onChangeText: (value: string) => void;
> onFinish: () => void;
> };
> type Controller = {
> active: EditingField | null;
> visibleBottom: number | null;
> begin: (field: EditingField) => void;
> update: (field: EditingField) => void;
> owns: (id: string) => boolean;
> finish: (id: string) => void;
> cancel: (id: string) => void;
> };
> const Context = createContext<Controller | null>(null);
> export const useKeyboardField = () => useContext(Context);

/** One editing session per screen; fields retain ownership of their draft values. */
export function KeyboardFieldProvider({ children }: { children: ReactNode }) {
const root = useRef<ComponentRef<typeof View>>(null);
const { height: windowHeight } = useWindowDimensions();
const [frame, setFrame] = useState({ y: 0, height: windowHeight });
const [keyboardTop, setKeyboardTop] = useState<number | null>(null);
const [barHeight, setBarHeight] = useState(60);
const measure = useCallback(
() =>
root.current?.measureInWindow((_x, y, _width, height) => {
setFrame((previous) =>
previous.y === y && previous.height === height ? previous : { y, height },
);
}),
[],
);
const [active, setActive] = useState<EditingField | null>(null);
const current = useRef<EditingField | null>(null);
const begin = useCallback((field: EditingField) => {
if (current.current && current.current.id !== field.id) current.current.onFinish();
current.current = field;
setActive(field);
}, []);
const update = useCallback((field: EditingField) => {
if (current.current?.id !== field.id) return;
current.current = field;
setActive(field);
}, []);
const owns = useCallback((id: string) => current.current?.id === id, []);
const finish = useCallback((id: string) => {
if (current.current?.id !== id) return;
const field = current.current;
current.current = null;
setActive(null);
field.onFinish();
}, []);
const cancel = useCallback((id: string) => {
if (current.current?.id !== id) return;
current.current = null;
setActive(null);
Keyboard.dismiss();
}, []);
useEffect(() => {
const show = (event: KeyboardEvent) => setKeyboardTop(event.endCoordinates.screenY);
const shown = Keyboard.addListener('keyboardDidShow', show);
const changing =
Platform.OS === 'ios' ? Keyboard.addListener('keyboardWillChangeFrame', show) : null;
const hidden = Keyboard.addListener('keyboardDidHide', () => {
setKeyboardTop(null);
if (current.current) finish(current.current.id);
});
return () => {
shown.remove();
changing?.remove();
hidden.remove();
};
}, [finish]);
return (
<Context.Provider
value={{
        active,
        visibleBottom: keyboardTop === null ? null : keyboardTop - barHeight,
        begin,
        update,
        owns,
        finish,
        cancel,
      }} >
<View ref={root} style={styles.root} onLayout={measure}>
{children}
{active ? (
<View
style={[
styles.floating,
{
top: Math.max(
0,
(keyboardTop === null ? frame.height : keyboardTop - frame.y) - barHeight,
),
},
]}
onLayout={(event) => setBarHeight(event.nativeEvent.layout.height)} >
<KeyboardFieldBar field={active} onFinish={() => finish(active.id)} />
</View>
) : null}
</View>
</Context.Provider>
);
}

export function KeyboardFieldBar({
field,
onFinish,
}: {
field: EditingField;
onFinish: () => void;
}) {
const input = useRef<ComponentRef<typeof TextInput>>(null);
const finish = useRef(onFinish);
finish.current = onFinish;
useEffect(() => {
const frame = requestAnimationFrame(() => input.current?.focus());
const hidden =
Platform.OS === 'android'
? Keyboard.addListener('keyboardDidHide', () => {
input.current?.blur();
finish.current();
})
: undefined;
return () => {
cancelAnimationFrame(frame);
hidden?.remove();
};
}, [field.id]);
return (
<View style={styles.editor}>
<View style={styles.bar} onLayout={() => requestAnimationFrame(() => input.current?.focus())}>
<View style={styles.field}>
<TextInput
{...field.input}
ref={input}
autoFocus
inputAccessoryViewID={`keyboard-bar-${field.id}`}
value={field.value}
accessibilityLabel={`Keyboard input: ${field.label}`}
accessibilityHint={field.error}
placeholderTextColor={colors.muted}
returnKeyType="default"
submitBehavior="blurAndSubmit"
onChangeText={field.onChangeText}
onBlur={onFinish}
onSubmitEditing={() => {
input.current?.blur();
Keyboard.dismiss();
}}
style={[styles.input, field.error && styles.invalid]}
/>
{field.suffix ? (
<AppText variant="small" style={styles.suffix}>
{field.suffix}
</AppText>
) : null}
</View>
<Pressable
accessibilityRole="button"
accessibilityLabel="OK"
accessibilityHint="Finishes editing and dismisses the keyboard"
onPress={() => {
input.current?.blur();
onFinish();
Keyboard.dismiss();
}}
style={styles.done} >
<AppText variant="label" style={styles.doneLabel}>
OK
</AppText>
</Pressable>
</View>
{field.error ? (
<AppText variant="small" accessibilityRole="alert" style={styles.error}>
{field.error}
</AppText>
) : null}
</View>
);
}
const styles = StyleSheet.create({
root: { flex: 1 },
editor: { backgroundColor: colors.canvas },
error: { paddingHorizontal: 12, paddingBottom: 8 },
floating: { position: 'absolute', left: 0, right: 0, zIndex: 100 },
bar: {
flexDirection: 'row',
alignItems: 'center',
gap: 8,
paddingHorizontal: 12,
paddingVertical: 8,
backgroundColor: colors.canvas,
borderTopWidth: 1,
borderColor: colors.line,
},
field: {
flex: 1,
minWidth: 0,
flexDirection: 'row',
alignItems: 'center',
gap: 8,
paddingHorizontal: 12,
borderWidth: 2,
borderColor: colors.blue,
borderRadius: 18,
backgroundColor: colors.tint,
},
input: {
flex: 1,
minWidth: 0,
minHeight: 44,
paddingVertical: 8,
paddingHorizontal: 0,
fontSize: 18,
lineHeight: 24,
fontFamily: fonts.semibold,
color: colors.ink,
},
suffix: { color: colors.muted },
invalid: { textDecorationLine: 'underline' },
done: { minHeight: 44, minWidth: 52, alignItems: 'center', justifyContent: 'center' },
doneLabel: { color: colors.blue },
});
