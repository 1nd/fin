// CCA: 4
import { Stack } from 'expo-router';
import { AppServicesProvider } from '@/data/AppServicesProvider';
import { DEFAULT_LANGUAGE } from '@/domain/models';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <AppServicesProvider>
      <ThemeProvider>
        {/* No signed-in user yet at this layer (auth wiring is task 5.5) — DEFAULT_LANGUAGE
            is the hardcoded final fallback (design Decision 8); per-user resolved language
            is applied deeper, once Settings can be read for the signed-in userId. */}
        <I18nProvider language={DEFAULT_LANGUAGE}>
          <Stack screenOptions={{ headerShown: false }} />
        </I18nProvider>
      </ThemeProvider>
    </AppServicesProvider>
  );
}
