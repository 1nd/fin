// CCA: 4
import { ENTITY_TYPES, type EntityType } from '@/domain/models';
import { Button } from '@/shared-ui/Button';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

interface EntityTypeTabsProps {
  value: EntityType;
  onChange(value: EntityType): void;
}

/** Scopes the category tree view to one entity type at a time. */
export function EntityTypeTabs({ value, onChange }: EntityTypeTabsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.tabs}>
      {ENTITY_TYPES.map((entityType) => (
        <Button
          key={entityType}
          label={t(`categories.entityTypes.${entityType}`)}
          variant={entityType === value ? 'primary' : 'secondary'}
          onPress={() => onChange(entityType)}
        />
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    tabs: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });
}
