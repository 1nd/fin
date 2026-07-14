// CCA: 4
import { buildCategoryTree } from '@/domain/category-tree';
import { ENTITY_TYPES, type EntityType } from '@/domain/models';
import { useErrorMessage } from '@/i18n/error-messages';
import { Button } from '@/shared-ui/Button';
import { ConfirmDialog } from '@/shared-ui/ConfirmDialog';
import { EmptyState } from '@/shared-ui/EmptyState';
import { ErrorBanner } from '@/shared-ui/ErrorBanner';
import { LoadingState } from '@/shared-ui/LoadingState';
import { Screen } from '@/shared-ui/Screen';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { CategoryTree } from './CategoryTree';
import { EntityTypeTabs } from './EntityTypeTabs';
import { NewCategoryForm } from './NewCategoryForm';
import { useCategories } from './useCategories';

/** Category management screen: tree view, create/rename/delete/reparent, scoped per entity type (will be reworked per Task 12.11). */
export function CategoryScreen({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const getErrorMessage = useErrorMessage();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [entityType, setEntityType] = useState<EntityType>(ENTITY_TYPES[0]);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<unknown>(null);

  const {
    categories,
    rollups,
    loading,
    error: loadError,
    reload,
    createCategory,
    renameCategory,
    deleteCategory,
    reparentCategory,
  } = useCategories(userId);

  const tree = buildCategoryTree(categories, entityType);

  const changeEntityType = (next: EntityType) => {
    setEntityType(next);
    setMovingId(null);
    setOperationError(null);
  };

  const runAction = async (action: () => Promise<void>) => {
    try {
      await action();
      setOperationError(null);
    } catch (err) {
      setOperationError(err);
    }
  };

  const move = (newParentId: string | null) => {
    if (!movingId) return;
    const id = movingId;
    setMovingId(null);
    void runAction(() => reparentCategory(id, newParentId));
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    void runAction(() => deleteCategory(id));
  };

  return (
    <Screen title={t('categories.title')}>
      <EntityTypeTabs value={entityType} onChange={changeEntityType} />
      {operationError ? <ErrorBanner message={getErrorMessage(operationError)} /> : null}
      <View style={styles.section}>
        <NewCategoryForm
          label={t('categories.addRoot')}
          onSubmit={(name) => void runAction(() => createCategory(entityType, name, null))}
        />
        {movingId ? (
          <View style={styles.movingRow}>
            <Button
              label={t('categories.moveToTopLevel')}
              variant="secondary"
              onPress={() => move(null)}
            />
            <Button
              label={t('categories.cancelMove')}
              variant="secondary"
              onPress={() => setMovingId(null)}
            />
          </View>
        ) : null}
        {loading ? (
          <LoadingState />
        ) : loadError ? (
          <ErrorBanner message={getErrorMessage(loadError)} onRetry={reload} />
        ) : tree.length === 0 ? (
          <EmptyState message={t('categories.empty')} />
        ) : (
          <CategoryTree
            nodes={tree}
            rollups={rollups}
            movingId={movingId}
            onAddChild={(parentId, name) =>
              void runAction(() => createCategory(entityType, name, parentId))
            }
            onRename={(id, name) => void runAction(() => renameCategory(id, name))}
            onRequestDelete={setPendingDeleteId}
            onStartMove={setMovingId}
            onMoveHere={move}
          />
        )}
      </View>
      <ConfirmDialog
        visible={pendingDeleteId !== null}
        title={t('categories.deleteConfirmTitle')}
        message={t('categories.confirmDelete')}
        destructive
        confirmLabel={t('categories.delete')}
        cancelLabel={t('categories.cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    section: {
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    movingRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
  });
}
