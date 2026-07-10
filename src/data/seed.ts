// CCA: 2
import type { Category, EntityType } from '@/domain/models';
import { UNCATEGORIZED_NAME } from '@/domain/models';
import type { DataRepository } from './repository-ports';

/**
 * Port for id generation — a platform detail (web `crypto.randomUUID` is not
 * available on React Native's Hermes runtime), so implementations are
 * supplied by the outer wiring layer, never called directly here.
 */
export type IdGenerator = () => string;

interface StarterNode {
  name: string;
  children?: StarterNode[];
}

const STARTER_TREES: Record<EntityType, StarterNode[]> = {
  asset: [
    {
      name: 'Cash & Bank',
      children: [
        { name: 'Cash' },
        { name: 'Bank', children: [{ name: 'Checking' }, { name: 'Savings' }] },
      ],
    },
    { name: 'Investments', children: [{ name: 'Stocks' }, { name: 'Crypto' }] },
    { name: 'Property', children: [{ name: 'Real Estate' }, { name: 'Vehicles' }] },
  ],
  liability: [
    {
      name: 'Loans',
      children: [{ name: 'Mortgage' }, { name: 'Auto Loan' }, { name: 'Personal Loan' }],
    },
    { name: 'Credit Cards' },
    { name: 'Other Debts' },
  ],
  income: [
    { name: 'Salary' },
    { name: 'Business' },
    { name: 'Investment Income', children: [{ name: 'Dividends' }, { name: 'Interest' }] },
    { name: 'Other Income' },
  ],
  expense: [
    { name: 'Food', children: [{ name: 'Groceries' }, { name: 'Eating Out' }] },
    { name: 'Transport', children: [{ name: 'Fuel' }, { name: 'Public Transit' }] },
    { name: 'Housing', children: [{ name: 'Rent' }, { name: 'Utilities' }] },
    { name: 'Entertainment' },
    { name: 'Health' },
    { name: 'Shopping' },
    { name: 'Other' },
  ],
};

export function buildStarterCategories(userId: string, generateId: IdGenerator): Category[] {
  const now = new Date().toISOString();
  const categories: Category[] = [];

  (Object.keys(STARTER_TREES) as EntityType[]).forEach((entityType) => {
    categories.push({
      id: generateId(),
      userId,
      entityType,
      name: UNCATEGORIZED_NAME,
      parentId: null,
      isSystem: true,
      createdAt: now,
    });

    const addNodes = (nodes: StarterNode[], parentId: string | null): void => {
      for (const node of nodes) {
        const id = generateId();
        categories.push({
          id,
          userId,
          entityType,
          name: node.name,
          parentId,
          isSystem: false,
          createdAt: now,
        });
        if (node.children) addNodes(node.children, id);
      }
    };
    addNodes(STARTER_TREES[entityType], null);
  });

  return categories;
}

/** Seeds starter categories the first time a user's account is initialized (Task 6.6 in `fin-phase-1`). */
export async function seedIfFirstSignIn(
  dataRepository: DataRepository,
  userId: string,
  generateId: IdGenerator,
): Promise<void> {
  const hasData = await dataRepository.hasAnyDataForUser(userId);
  if (hasData) return;
  await dataRepository.categories.bulkUpsert(buildStarterCategories(userId, generateId));
}
