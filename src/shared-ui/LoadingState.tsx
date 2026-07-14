// CCA: 4
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { Text } from './Text';

interface LoadingStateProps {
  message?: string;
}

/** Shown while a data-backed screen has not yet finished reading its data (ui-foundation spec). */
export function LoadingState({ message }: LoadingStateProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text variant="bodySecondary">{message ?? t('common.loading')}</Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
  });
}
