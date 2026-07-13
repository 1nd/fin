// CCA: 2
import { createContext, useContext } from 'react';
import type { StorageRepository } from './repository-ports';

/** Populated by `AppServicesProvider` (CCA 4), which picks the platform's concrete implementation. */
export const RepositoryContext = createContext<StorageRepository | null>(null);

/** Calling code depends on this hook, never on IndexedDB or any storage engine directly. */
export function useRepository(): StorageRepository {
  const repository = useContext(RepositoryContext);
  if (!repository) {
    throw new Error('useRepository must be used within an AppServicesProvider');
  }
  return repository;
}
