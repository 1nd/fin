import { ReparentCycleError } from '@/domain/category-tree';
import { resolveErrorMessageKey } from './error-messages';

describe('resolveErrorMessageKey', () => {
  it('maps a ReparentCycleError to its specific translation key', () => {
    expect(resolveErrorMessageKey(new ReparentCycleError())).toBe('errors.categoryReparentCycle');
  });

  it('falls back to a generic translation key for unrecognized errors', () => {
    expect(resolveErrorMessageKey(new Error('boom'))).toBe('errors.generic');
    expect(resolveErrorMessageKey('a raw string')).toBe('errors.generic');
    expect(resolveErrorMessageKey(undefined)).toBe('errors.generic');
  });
});
