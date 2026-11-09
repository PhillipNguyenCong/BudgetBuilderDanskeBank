import { usePreventRemove, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { WidgetPreviewScreen } from '../../../features/budget-preview';

export default function WidgetPreview() {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  usePreventRemove(dirty, ({ repeat }) => {
    Alert.alert('Discard sample edits?', 'Your preview changes have not been saved.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard edits',
        style: 'destructive',
        onPress: () => {
          setDirty(false);
          repeat();
        },
      },
    ]);
  });
  return (
    <WidgetPreviewScreen
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/budget'))}
      onDirty={() => setDirty(true)}
    />
  );
}
