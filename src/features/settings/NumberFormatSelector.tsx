// CCA: 4
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { NumberFormatPreference } from '@/domain/models';
import { formatNumber } from '@/i18n/number-format';
import { Button } from '@/shared-ui/Button';
import { Text } from '@/shared-ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

const NUMBER_FORMAT_OPTIONS: NumberFormatPreference[] = ['id-ID', 'en-US'];
const SAMPLE_VALUE = 1234.56;

interface NumberFormatSelectorProps {
  value: NumberFormatPreference;
  onChange: (value: NumberFormatPreference) => void;
}

export function NumberFormatSelector({ value, onChange }: NumberFormatSelectorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text variant="label">{t('settings.numberFormat.label')}</Text>
      <View style={styles.options}>
        {NUMBER_FORMAT_OPTIONS.map((option) => (
          <Button
            key={option}
            label={`${t(`settings.numberFormat.options.${option}`)} (${formatNumber(SAMPLE_VALUE, option)})`}
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
