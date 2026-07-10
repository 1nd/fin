// CCA: 4
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

export function Screen({ style, children, ...rest }: SafeAreaViewProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <SafeAreaView style={[styles.screen, style]} {...rest}>
      {children}
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
    },
  });
}
