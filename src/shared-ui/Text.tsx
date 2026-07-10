// CCA: 4
import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export type TextVariant = 'heading' | 'title' | 'body' | 'bodySecondary' | 'label' | 'caption';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
}

export function Text({ variant = 'body', style, ...rest }: TextProps) {
  const theme = useTheme();

  const variantStyles: Record<TextVariant, TextStyle> = {
    heading: {
      fontSize: theme.typography.sizes.xl,
      lineHeight: theme.typography.lineHeights.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.textPrimary,
    },
    title: {
      fontSize: theme.typography.sizes.lg,
      lineHeight: theme.typography.lineHeights.lg,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.textPrimary,
    },
    body: {
      fontSize: theme.typography.sizes.md,
      lineHeight: theme.typography.lineHeights.md,
      fontWeight: theme.typography.weights.regular,
      color: theme.colors.textPrimary,
    },
    bodySecondary: {
      fontSize: theme.typography.sizes.md,
      lineHeight: theme.typography.lineHeights.md,
      fontWeight: theme.typography.weights.regular,
      color: theme.colors.textSecondary,
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      lineHeight: theme.typography.lineHeights.sm,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.textSecondary,
    },
    caption: {
      fontSize: theme.typography.sizes.xs,
      lineHeight: theme.typography.lineHeights.xs,
      fontWeight: theme.typography.weights.regular,
      color: theme.colors.textDisabled,
    },
  };

  return (
    <RNText
      style={[{ fontFamily: theme.typography.fontFamily }, variantStyles[variant], style]}
      {...rest}
    />
  );
}
