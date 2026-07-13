// CCA: 3
import type { IdGenerator } from './port';

/** `crypto.randomUUID` -- Phase 1 targets web only (design Decision 2). Implementation of the `IdGenerator` port for Web platform. */
export const webIdGenerator: IdGenerator = () => crypto.randomUUID();
