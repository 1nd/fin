// CCA: 4
import React, { useMemo } from 'react';
import { IdGeneratorContext } from './id-generator/id-generator-context';
import { webIdGenerator } from './id-generator/web-id-generator';
import { IndexedDbStorageRepository } from './indexeddb/IndexedDbStorageRepository';
import { RepositoryContext } from './repository-context';
import type { StorageRepository } from './repository-ports';

export function AppServicesProvider({ children }: { children: React.ReactNode }) {
  const repository = useMemo<StorageRepository>(() => new IndexedDbStorageRepository(), []);
  return (
    <RepositoryContext.Provider value={repository}>
      <IdGeneratorContext.Provider value={webIdGenerator}>{children}</IdGeneratorContext.Provider>
    </RepositoryContext.Provider>
  );
}
