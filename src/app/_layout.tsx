// CCA: 4
import { AppServicesProvider } from '@/data/AppServicesProvider';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { useAuth } from '@/features/auth/auth-context';
import { I18nProvider } from '@/i18n/I18nProvider';
import { useUserLanguage } from '@/i18n/useUserLanguage';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Stack } from 'expo-router';

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export default function RootLayout() {
  return (
    <AppServicesProvider>
      <ThemeProvider>
        <AuthProvider clientId={GOOGLE_CLIENT_ID}>
          <LocalizedStack />
        </AuthProvider>
      </ThemeProvider>
    </AppServicesProvider>
  );
}

/** Bridges the signed-in user (if any) to `I18nProvider`, so a language change in Settings takes effect app-wide. */
function LocalizedStack() {
  const auth = useAuth();
  const userId = auth.status === 'signed-in' ? auth.user.userId : null;
  const googleAccountLocale = auth.status === 'signed-in' ? auth.user.locale : null;
  const language = useUserLanguage(userId, googleAccountLocale);

  return (
    <I18nProvider language={language}>
      <Stack screenOptions={{ headerShown: false }} />
    </I18nProvider>
  );
}
