// CCA: 4
import React, { useMemo } from 'react';
import { IndexedDbDataRepository } from './indexeddb/IndexedDbDataRepository';
import { RepositoryContext } from './repository-context';
import type { DataRepository } from './repository-ports';

export function RepositoryProvider({ children }: { children: React.ReactNode }) {
  const repository = useMemo<DataRepository>(() => new IndexedDbDataRepository(), []);
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>;
}
