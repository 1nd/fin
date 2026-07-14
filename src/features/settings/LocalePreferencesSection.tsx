// CCA: 4
import { Text } from '@/shared-ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DateFormatSelector } from './DateFormatSelector';
import { LanguageSelector } from './LanguageSelector';
import { NumberFormatSelector } from './NumberFormatSelector';
import { useLocalePreferences } from './useLocalePreferences';

/** Settings section composing the three independent locale selectors. Mounted into the Settings shell later (in "Settings" task). */
export function LocalePreferencesSection({ userId }: { userId: string }) {
  const { settings, loading, setLanguage, setNumberFormat, setDateFormat } =
    useLocalePreferences(userId);
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (loading || !settings) {
    return <Text variant="bodySecondary">Loading…</Text>;
  }

  return (
    <View style={styles.container}>
      <LanguageSelector value={settings.language} onChange={setLanguage} />
      <NumberFormatSelector value={settings.numberFormat} onChange={setNumberFormat} />
      <DateFormatSelector value={settings.dateFormat} onChange={setDateFormat} />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.lg,
    },
  });
}
