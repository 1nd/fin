// CCA: 3
import { useTranslation } from 'react-i18next';
import { ReparentCycleError } from '@/domain/category-tree';

/**
 * Maps a domain/storage error to a translation key, so the UI never renders
 * raw exception text as a user-facing message (ui-foundation spec: "Errors
 * shown to users are human-readable and localized", Task 12.9). Falls back to
 * a generic message for anything not explicitly recognized (storage
 * failures, unexpected errors) rather than surfacing the raw error.
 */
export function resolveErrorMessageKey(error: unknown): string {
  if (error instanceof ReparentCycleError) return 'errors.categoryReparentCycle';
  return 'errors.generic';
}

/** Convenience hook: translates an error directly to a human-readable message. */
export function useErrorMessage(): (error: unknown) => string {
  const { t } = useTranslation();
  return (error: unknown) => t(resolveErrorMessageKey(error));
}
