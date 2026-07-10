// CCA: 2
import { createContext, useContext } from 'react';
import type { DataRepository } from './repository-ports';

/** Populated by `RepositoryProvider` (CCA 4), which picks the platform's concrete implementation. */
export const RepositoryContext = createContext<DataRepository | null>(null);

/** Calling code depends on this hook, never on IndexedDB or any storage engine directly. */
export function useRepository(): DataRepository {
  const repository = useContext(RepositoryContext);
  if (!repository) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return repository;
}
