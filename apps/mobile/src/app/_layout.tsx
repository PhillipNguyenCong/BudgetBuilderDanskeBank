import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../foundation/theme/theme';
void SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [loaded, error] = useFonts({
    'OpenSans-Regular': require('../../assets/fonts/OpenSans-Regular.ttf'),
    'OpenSans-SemiBold': require('../../assets/fonts/OpenSans-SemiBold.ttf'),
  });
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}
      />
    </SafeAreaProvider>
  );
}
