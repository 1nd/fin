// CCA: 4
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

export type IconName = keyof typeof Ionicons.glyphMap;

interface IconButtonProps {
  name: IconName;
  onPress: (event: GestureResponderEvent) => void;
  accessibilityLabel: string;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

/** A small tappable icon affordance, e.g. a per-row action (Task 12.6). */
export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  variant = 'default',
  disabled = false,
}: IconButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const color = disabled
    ? theme.colors.textDisabled
    : variant === 'danger'
      ? theme.colors.negative
      : theme.colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.base, pressed && !disabled && styles.pressed]}
    >
      <Ionicons name={name} size={theme.typography.sizes.lg} color={color} />
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      padding: theme.spacing.sm,
      borderRadius: theme.radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      backgroundColor: theme.colors.surfaceVariant,
    },
  });
}
