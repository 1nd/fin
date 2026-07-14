import { IdGeneratorContext } from '@/data/id-generator/id-generator-context';
import { webIdGenerator } from '@/data/id-generator/web-id-generator';
import { IndexedDbStorageRepository } from '@/data/indexeddb/IndexedDbStorageRepository';
import { RepositoryContext } from '@/data/repository-context';
import type { StorageRepository } from '@/data/repository-ports';
import type { Category } from '@/domain/models';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { CategoryScreen } from './CategoryScreen';

/** In-memory fake for driving `useCategories` through states real IndexedDB can't force on demand. */
function createFakeRepository(categories: Category[] = []): StorageRepository {
  return {
    categories: {
      listByUser: async () => categories,
      create: async () => {},
      update: async () => {},
      delete: async () => {},
      bulkUpsert: async () => {},
    },
    entries: {
      listByUser: async () => [],
      create: async () => {},
      update: async () => {},
      delete: async () => {},
      bulkUpsert: async () => {},
    },
    settings: {
      get: async () => undefined,
      put: async () => {},
    },
    hasAnyDataForUser: async () => true,
    replaceAllForUser: async () => {},
  };
}

function renderScreen(repository: StorageRepository) {
  return render(
    <I18nProvider language="en">
      <ThemeProvider>
        <RepositoryContext.Provider value={repository}>
          <IdGeneratorContext.Provider value={webIdGenerator}>
            <CategoryScreen userId="user-a" />
          </IdGeneratorContext.Provider>
        </RepositoryContext.Provider>
      </ThemeProvider>
    </I18nProvider>,
  );
}

describe('CategoryScreen render smoke test', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  it('renders the entity type tabs and starter categories once seeded', async () => {
    await renderScreen(new IndexedDbStorageRepository());

    expect(screen.getByText('Categories')).toBeTruthy();
    expect(screen.getByText('Expenses')).toBeTruthy();
    expect(await screen.findByText('Cash & Bank')).toBeTruthy();
  });
});

describe('CategoryScreen data states', () => {
  it('shows an empty state when the user has no categories', async () => {
    await renderScreen(createFakeRepository([]));

    expect(await screen.findByText('No categories yet.')).toBeTruthy();
  });

  it('shows a retry-able error banner when the initial load fails, and recovers on retry', async () => {
    let attempt = 0;
    const repository = createFakeRepository([]);
    repository.hasAnyDataForUser = async () => {
      attempt += 1;
      if (attempt === 1) throw new Error('boom');
      return true;
    };

    await renderScreen(repository);

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy();

    fireEvent.press(screen.getByText('Retry'));

    expect(await screen.findByText('No categories yet.')).toBeTruthy();
  });

  it('only deletes a category when the confirmation dialog is confirmed', async () => {
    const now = new Date().toISOString();
    const uncategorized: Category = {
      id: 'sys-1',
      userId: 'user-a',
      entityType: 'asset',
      name: 'Uncategorized',
      parentId: null,
      isSystem: true,
      createdAt: now,
    };
    const category: Category = {
      id: 'c1',
      userId: 'user-a',
      entityType: 'asset',
      name: 'Cash & Bank',
      parentId: null,
      isSystem: false,
      createdAt: now,
    };
    await renderScreen(createFakeRepository([uncategorized, category]));
    await screen.findByText('Cash & Bank');

    fireEvent.press(screen.getByLabelText('Delete'));
    expect(await screen.findByText('Delete category?')).toBeTruthy();

    fireEvent.press(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Delete category?')).toBeNull());
    expect(screen.getByText('Cash & Bank')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Delete'));
    await screen.findByText('Delete category?');
    fireEvent.press(screen.getByText('Delete'));

    await waitFor(() => expect(screen.queryByText('Cash & Bank')).toBeNull());
  });
});
