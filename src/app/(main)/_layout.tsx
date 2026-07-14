// CCA: 4
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';
import { RequireAuth } from '@/features/auth/AuthGate';
import { useTheme } from '@/theme/ThemeProvider';

/** Matches Screen's content-column breakpoint (design Decision 15). */
const WIDE_BREAKPOINT = 768;

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, IconName> = {
  index: 'home-outline',
  categories: 'pricetags-outline',
  entries: 'list-outline',
  reports: 'stats-chart-outline',
  settings: 'settings-outline',
};

export default function MainLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const tabBarPosition = width >= WIDE_BREAKPOINT ? 'left' : 'bottom';

  return (
    <RequireAuth>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarPosition,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('nav.dashboard'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICONS.index} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: t('nav.categories'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICONS.categories} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="entries"
          options={{
            title: t('nav.entries'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICONS.entries} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: t('nav.reports'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICONS.reports} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('nav.settings'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICONS.settings} size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </RequireAuth>
  );
}
