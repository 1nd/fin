// CCA: 4
import type { CategoryTreeNode } from '@/domain/category-tree';
import { IconButton } from '@/shared-ui/IconButton';
import { ListItem } from '@/shared-ui/ListItem';
import { Text } from '@/shared-ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { NewCategoryForm } from './NewCategoryForm';

export interface CategoryTreeProps {
  nodes: CategoryTreeNode[];
  /** Category id -> base-currency rollup total. */
  rollups: Map<string, number>;
  /** Id of the category currently being reparented, if any. */
  movingId: string | null;
  onAddChild(parentId: string, name: string): void;
  onRename(id: string, name: string): void;
  onRequestDelete(id: string): void;
  onStartMove(id: string): void;
  onMoveHere(id: string): void;
}

/** Recursive category tree view: create/rename/delete/reparent, one entity type at a time. */
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
  onRequestDelete,
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
        <ListItem
          actions={
            movingId ? (
              !isMoving ? (
                <IconButton
                  name="arrow-forward-circle-outline"
                  accessibilityLabel={t('categories.moveHere')}
                  onPress={() => onMoveHere(category.id)}
                />
              ) : undefined
            ) : (
              <>
                <IconButton
                  name="add-circle-outline"
                  accessibilityLabel={t('categories.addChild')}
                  onPress={() => setAddingChild(true)}
                />
                <IconButton
                  name="pencil-outline"
                  accessibilityLabel={t('categories.rename')}
                  onPress={() => setRenaming(true)}
                />
                <IconButton
                  name="swap-vertical-outline"
                  accessibilityLabel={t('categories.move')}
                  onPress={() => onStartMove(category.id)}
                />
                <IconButton
                  name="trash-outline"
                  variant="danger"
                  accessibilityLabel={t('categories.delete')}
                  onPress={() => onRequestDelete(category.id)}
                />
              </>
            )
          }
        >
          <View style={styles.row}>
            <Text variant="body">{category.name}</Text>
            <Text variant="caption">{total.toLocaleString()}</Text>
          </View>
        </ListItem>
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
              onRequestDelete={onRequestDelete}
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
      marginTop: theme.spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },
  });
}
