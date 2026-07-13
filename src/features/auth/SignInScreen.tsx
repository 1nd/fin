// CCA: 4
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Button } from '@/shared-ui/Button';
import { Card } from '@/shared-ui/Card';
import { Screen } from '@/shared-ui/Screen';
import { Text } from '@/shared-ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { useAuth } from './auth-context';

/**
 * Unauthenticated entry point. States plainly that Phase 1 sign-in is an access convenience,
 * not a security boundary for locally stored data (auth spec: "Sign-in is not a data security
 * boundary").
 */
export function SignInScreen() {
  const { t } = useTranslation();
  const auth = useAuth();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const error = auth.status === 'signed-out' ? auth.error : null;

  return (
    <Screen>
      <Card>
        <Text variant="heading">{t('auth.signIn.title')}</Text>
        <Text variant="bodySecondary" style={styles.description}>
          {t('auth.signIn.description')}
        </Text>
        {error ? (
          <Text variant="caption" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Button
          label={t('auth.signIn.button')}
          onPress={() => void auth.signIn()}
          disabled={!auth.canSignIn}
        />
      </Card>
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    description: {
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    error: {
      marginBottom: theme.spacing.sm,
    },
  });
}
