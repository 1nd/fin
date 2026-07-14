// CCA: 4
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  /** Destructive actions (e.g. delete) render the confirm button as danger (ui-foundation spec). */
  destructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Themed confirmation modal for destructive/irreversible actions (Task 12.7). */
export function ConfirmDialog({
  visible,
  title,
  message,
  destructive = false,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={styles.overlay}
        onPress={onCancel}
        accessibilityLabel={cancelLabel ?? t('common.cancel')}
        testID="confirm-dialog-overlay"
      >
        {/* An inner no-op Pressable claims the touch responder so taps inside the dialog don't dismiss it. */}
        <Pressable style={styles.dialog} onPress={() => {}} testID="confirm-dialog-card">
          <Text variant="title">{title}</Text>
          <Text variant="bodySecondary">{message}</Text>
          <View style={styles.actions}>
            <Button
              label={cancelLabel ?? t('common.cancel')}
              variant="secondary"
              onPress={onCancel}
            />
            <Button
              label={confirmLabel ?? t('common.confirm')}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    dialog: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.lg,
      maxWidth: 420,
      width: '100%',
      gap: theme.spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
  });
}
