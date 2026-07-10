// CCA: 4
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { DateFormatPreference } from '@/domain/models';
import { formatDate } from '@/i18n/date-format';
import { Button } from '@/shared-ui/Button';
import { Text } from '@/shared-ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

const DATE_FORMAT_OPTIONS: DateFormatPreference[] = ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'];
const SAMPLE_DATE = new Date(2026, 6, 21);

interface DateFormatSelectorProps {
  value: DateFormatPreference;
  onChange: (value: DateFormatPreference) => void;
}

export function DateFormatSelector({ value, onChange }: DateFormatSelectorProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="label">{t('settings.dateFormat.label')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {DATE_FORMAT_OPTIONS.map((option) => (
          <Button
            key={option}
            label={`${t(`settings.dateFormat.options.${option}`)} (${formatDate(SAMPLE_DATE, option)})`}
            variant={option === value ? 'primary' : 'secondary'}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
    </View>
  );
}
