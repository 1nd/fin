// CCA: 4
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SUPPORTED_LANGUAGES, type LanguagePreference } from '@/domain/models';
import { Button } from '@/shared-ui/Button';
import { Text } from '@/shared-ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface LanguageSelectorProps {
  value: LanguagePreference;
  onChange: (value: LanguagePreference) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="label">{t('settings.language.label')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
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
