// CCA: 4
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

interface ErrorBannerProps {
  /** Translated, human-readable message — never raw exception text (ui-foundation spec). */
  message: string;
  onRetry?: () => void;
}

/** Shown when loading or a user-initiated operation on a data-backed screen fails (ui-foundation spec). */
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text variant="body" style={styles.message}>
        {message}
      </Text>
      {onRetry ? <Button label={t('common.retry')} variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.negative,
      borderWidth: 1,
      borderRadius: theme.radii.md,
      padding: theme.spacing.sm,
    },
    message: {
      flex: 1,
      color: theme.colors.negative,
    },
  });
}
