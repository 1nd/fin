import { IdGeneratorContext } from '@/data/id-generator/id-generator-context';
import { webIdGenerator } from '@/data/id-generator/web-id-generator';
import { IndexedDbStorageRepository } from '@/data/indexeddb/IndexedDbStorageRepository';
import { RepositoryContext } from '@/data/repository-context';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { render, screen } from '@testing-library/react-native';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { CategoryScreen } from './CategoryScreen';

function renderScreen() {
  const repository = new IndexedDbStorageRepository();
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
    await renderScreen();

    expect(screen.getByText('Categories')).toBeTruthy();
    expect(screen.getByText('Expenses')).toBeTruthy();
    expect(await screen.findByText('Cash & Bank')).toBeTruthy();
  });
});
