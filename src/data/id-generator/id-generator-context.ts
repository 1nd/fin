// CCA: 2
import { createContext, useContext } from 'react';
import type { IdGenerator } from './port';

/** Populated by `AppServicesProvider` (CCA 4), which picks the platform's concrete implementation. */
export const IdGeneratorContext = createContext<IdGenerator | null>(null);

/** Calling code depends on this hook, never on a concrete id-generation strategy directly. */
export function useIdGenerator(): IdGenerator {
  const generateId = useContext(IdGeneratorContext);
  if (!generateId) {
    throw new Error('useIdGenerator must be used within an AppServicesProvider');
  }
  return generateId;
}
