// CCA: 4
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

/** Themed text field: border, focus state, placeholder color */
export function Input({ style, onFocus, onBlur, ...rest }: TextInputProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={theme.colors.textDisabled}
      style={[styles.input, focused && styles.inputFocused, style]}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      {...rest}
    />
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      color: theme.colors.textPrimary,
      minWidth: 160,
      fontSize: theme.typography.sizes.md,
    },
    inputFocused: {
      borderColor: theme.colors.primary,
    },
  });
}
