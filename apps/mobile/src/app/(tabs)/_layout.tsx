import { Tabs } from 'expo-router';
import { TabBar } from '../../features/shell';
export const unstable_settings = { initialRouteName: 'budget' };

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="initialRoute"
      screenOptions={{ headerShown: false, animation: 'none' }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="budget" options={{ title: 'Budget' }} />
      <Tabs.Screen name="cards" options={{ title: 'Cards' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
