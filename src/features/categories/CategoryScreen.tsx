// CCA: 4
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { buildCategoryTree } from '@/domain/category-tree';
import { ENTITY_TYPES, type EntityType } from '@/domain/models';
import { Button } from '@/shared-ui/Button';
import { Screen } from '@/shared-ui/Screen';
import { Text } from '@/shared-ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { CategoryTree } from './CategoryTree';
import { EntityTypeTabs } from './EntityTypeTabs';
import { NewCategoryForm } from './NewCategoryForm';
import { useCategories } from './useCategories';

/** Category management screen: tree view, create/rename/delete/reparent, scoped per entity type (Task 6.7). */
export function CategoryScreen({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [entityType, setEntityType] = useState<EntityType>(ENTITY_TYPES[0]);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    categories,
    rollups,
    loading,
    createCategory,
    renameCategory,
    deleteCategory,
    reparentCategory,
  } = useCategories(userId);

  const tree = buildCategoryTree(categories, entityType);

  const changeEntityType = (next: EntityType) => {
    setEntityType(next);
    setMovingId(null);
    setError(null);
  };

  const move = async (newParentId: string | null) => {
    if (!movingId) return;
    try {
      await reparentCategory(movingId, newParentId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setMovingId(null);
    }
  };

  return (
    <Screen>
      <Text variant="heading" style={styles.title}>
        {t('categories.title')}
      </Text>
      <EntityTypeTabs value={entityType} onChange={changeEntityType} />
      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <View style={styles.section}>
        <NewCategoryForm
          label={t('categories.addRoot')}
          onSubmit={(name) => void createCategory(entityType, name, null)}
        />
        {movingId ? (
          <View style={styles.movingRow}>
            <Button
              label={t('categories.moveToTopLevel')}
              variant="secondary"
              onPress={() => void move(null)}
            />
            <Button
              label={t('categories.cancelMove')}
              variant="secondary"
              onPress={() => setMovingId(null)}
            />
          </View>
        ) : null}
        {loading ? (
          <Text variant="bodySecondary">…</Text>
        ) : tree.length === 0 ? (
          <Text variant="bodySecondary">{t('categories.empty')}</Text>
        ) : (
          <CategoryTree
            nodes={tree}
            rollups={rollups}
            movingId={movingId}
            onAddChild={(parentId, name) => void createCategory(entityType, name, parentId)}
            onRename={(id, name) => void renameCategory(id, name)}
            onDelete={(id) => void deleteCategory(id)}
            onStartMove={setMovingId}
            onMoveHere={(targetId) => void move(targetId)}
          />
        )}
      </View>
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    title: {
      marginBottom: theme.spacing.md,
    },
    error: {
      marginTop: theme.spacing.sm,
    },
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
