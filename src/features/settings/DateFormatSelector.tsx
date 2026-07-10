// CCA: 4
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { DateFormatPreference } from '@/domain/models';
import { formatDate } from '@/i18n/date-format';
import { Button } from '@/shared-ui/Button';
import { Text } from '@/shared-ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

const DATE_FORMAT_OPTIONS: DateFormatPreference[] = ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'];
const SAMPLE_DATE = new Date(2026, 6, 21);

interface DateFormatSelectorProps {
  value: DateFormatPreference;
  onChange: (value: DateFormatPreference) => void;
}

export function DateFormatSelector({ value, onChange }: DateFormatSelectorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text variant="label">{t('settings.dateFormat.label')}</Text>
      <View style={styles.options}>
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
