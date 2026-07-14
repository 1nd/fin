// CCA: 4
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/shared-ui/Button';
import { Input } from '@/shared-ui/Input';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

interface NewCategoryFormProps {
  label: string;
  initialValue?: string;
  onSubmit(name: string): void;
  onCancel?(): void;
}

/** Inline name-entry form reused for creating and renaming categories. */
export function NewCategoryForm({
  label,
  initialValue = '',
  onSubmit,
  onCancel,
}: NewCategoryFormProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [name, setName] = useState(initialValue);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setName('');
  };

  return (
    <View style={styles.row}>
      <Input
        value={name}
        onChangeText={setName}
        placeholder={t('categories.namePlaceholder')}
        style={styles.input}
      />
      <Button label={label} onPress={submit} />
      {onCancel ? (
        <Button label={t('categories.cancel')} variant="secondary" onPress={onCancel} />
      ) : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      color: theme.colors.textPrimary,
      minWidth: 160,
    },
  });
}
