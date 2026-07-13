// CCA: 4
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { CategoryTreeNode } from '@/domain/category-tree';
import { Button } from '@/shared-ui/Button';
import { Text } from '@/shared-ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { NewCategoryForm } from './NewCategoryForm';

export interface CategoryTreeProps {
  nodes: CategoryTreeNode[];
  /** Category id -> base-currency rollup total (Task 6.3). */
  rollups: Map<string, number>;
  /** Id of the category currently being reparented, if any. */
  movingId: string | null;
  onAddChild(parentId: string, name: string): void;
  onRename(id: string, name: string): void;
  onDelete(id: string): void;
  onStartMove(id: string): void;
  onMoveHere(id: string): void;
}

/** Recursive category tree view: create/rename/delete/reparent, one entity type at a time (Task 6.7). */
export function CategoryTree(props: CategoryTreeProps) {
  return (
    <View>
      {props.nodes.map((node) => (
        <CategoryTreeItem key={node.category.id} node={node} depth={0} {...props} />
      ))}
    </View>
  );
}

interface CategoryTreeItemProps extends Omit<CategoryTreeProps, 'nodes'> {
  node: CategoryTreeNode;
  depth: number;
}

function CategoryTreeItem({
  node,
  depth,
  rollups,
  movingId,
  onAddChild,
  onRename,
  onDelete,
  onStartMove,
  onMoveHere,
}: CategoryTreeItemProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [renaming, setRenaming] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const { category, children } = node;
  const total = rollups.get(category.id) ?? 0;
  const isMoving = movingId === category.id;

  return (
    <View style={[styles.item, { marginLeft: depth * theme.spacing.lg }]}>
      {renaming ? (
        <NewCategoryForm
          initialValue={category.name}
          label={t('categories.save')}
          onSubmit={(name) => {
            onRename(category.id, name);
            setRenaming(false);
          }}
          onCancel={() => setRenaming(false)}
        />
      ) : (
        <View style={styles.row}>
          <Text variant="body">{category.name}</Text>
          <Text variant="caption">{total.toLocaleString()}</Text>
          {movingId ? (
            !isMoving && (
              <Button
                label={t('categories.moveHere')}
                variant="secondary"
                onPress={() => onMoveHere(category.id)}
              />
            )
          ) : (
            <>
              <Button
                label={t('categories.addChild')}
                variant="secondary"
                onPress={() => setAddingChild(true)}
              />
              <Button
                label={t('categories.rename')}
                variant="secondary"
                onPress={() => setRenaming(true)}
              />
              <Button
                label={t('categories.move')}
                variant="secondary"
                onPress={() => onStartMove(category.id)}
              />
              <Button
                label={t('categories.delete')}
                variant="danger"
                onPress={() => onDelete(category.id)}
              />
            </>
          )}
        </View>
      )}
      {addingChild ? (
        <NewCategoryForm
          label={t('categories.save')}
          onSubmit={(name) => {
            onAddChild(category.id, name);
            setAddingChild(false);
          }}
          onCancel={() => setAddingChild(false)}
        />
      ) : null}
      {children.length > 0 ? (
        <View>
          {children.map((child) => (
            <CategoryTreeItem
              key={child.category.id}
              node={child}
              depth={depth + 1}
              rollups={rollups}
              movingId={movingId}
              onAddChild={onAddChild}
              onRename={onRename}
              onDelete={onDelete}
              onStartMove={onStartMove}
              onMoveHere={onMoveHere}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    item: {
      marginTop: theme.spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },
  });
}
