// CCA: 4
import { Tabs } from 'expo-router';
import { RequireAuth } from '@/features/auth/AuthGate';

export default function MainLayout() {
  return (
    <RequireAuth>
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="categories" options={{ title: 'Categories' }} />
        <Tabs.Screen name="entries" options={{ title: 'Entries' }} />
        <Tabs.Screen name="reports" options={{ title: 'Reports' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </RequireAuth>
  );
}
