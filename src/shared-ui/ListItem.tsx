// CCA: 4
import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

interface ListItemProps {
  /** Main row content, e.g. a name and a value. */
  children: React.ReactNode;
  /** Trailing actions, e.g. IconButtons. */
  actions?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}

/** Row layout with content + trailing actions and a pressed state (Task 12.6). */
export function ListItem({ children, actions, onPress, style }: ListItemProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const row = (
    <View style={[styles.row, style]}>
      <View style={styles.content}>{children}</View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );

  if (!onPress) return row;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {row}
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radii.md,
      gap: theme.spacing.sm,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
