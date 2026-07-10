// CCA: 4
import React from 'react';
import { View } from 'react-native';
import { Text } from '@/shared-ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { DateFormatSelector } from './DateFormatSelector';
import { LanguageSelector } from './LanguageSelector';
import { NumberFormatSelector } from './NumberFormatSelector';
import { useLocalePreferences } from './useLocalePreferences';

/** Settings section composing the three independent locale selectors (Task 4.5). Mounted into the Settings shell in Task 10.3. */
export function LocalePreferencesSection({ userId }: { userId: string }) {
  const { settings, loading, setLanguage, setNumberFormat, setDateFormat } =
    useLocalePreferences(userId);
  const theme = useTheme();

  if (loading || !settings) {
    return <Text variant="bodySecondary">Loading…</Text>;
  }

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <LanguageSelector value={settings.language} onChange={setLanguage} />
      <NumberFormatSelector value={settings.numberFormat} onChange={setNumberFormat} />
      <DateFormatSelector value={settings.dateFormat} onChange={setDateFormat} />
    </View>
  );
}
