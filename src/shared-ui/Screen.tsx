// CCA: 4
import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { Text } from './Text';

/** Matches the navigation shell's sidebar/bottom-tabs breakpoint (design Decision 15). */
const WIDE_BREAKPOINT = 768;
const MAX_CONTENT_WIDTH = 880;

interface ScreenProps extends SafeAreaViewProps {
  /** Standard screen-header title, rendered above `children` (Task 12.4). */
  title?: string;
  /** Optional controls rendered alongside the title, e.g. an "add" action. */
  headerActions?: React.ReactNode;
}

export function Screen({ style, title, headerActions, children, ...rest }: ScreenProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={[styles.screen, style]} {...rest}>
      <View style={[styles.content, isWide && styles.contentWide]}>
        {title ? (
          <View style={styles.header}>
            <Text variant="heading">{title}</Text>
            {headerActions ? <View style={styles.headerActions}>{headerActions}</View> : null}
          </View>
        ) : null}
        {children}
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    contentWide: {
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    headerActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
  });
}
