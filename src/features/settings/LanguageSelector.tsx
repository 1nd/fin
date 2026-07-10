// CCA: 4
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SUPPORTED_LANGUAGES, type LanguagePreference } from '@/domain/models';
import { Button } from '@/shared-ui/Button';
import { Text } from '@/shared-ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

interface LanguageSelectorProps {
  value: LanguagePreference;
  onChange: (value: LanguagePreference) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text variant="label">{t('settings.language.label')}</Text>
      <View style={styles.options}>
        {SUPPORTED_LANGUAGES.map((option) => (
          <Button
            key={option}
            label={t(`settings.language.options.${option}`)}
            variant={option === value ? 'primary' : 'secondary'}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.sm,
    },
    options: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });
}
