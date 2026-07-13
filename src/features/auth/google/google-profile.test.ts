import { fetchGoogleProfile } from './google-profile';

describe('fetchGoogleProfile', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('maps the userinfo response to an AuthUser, defaulting absent fields to null', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sub: 'google-sub-1', email: 'a@example.com' }),
    }) as unknown as typeof fetch;

    const user = await fetchGoogleProfile('access-token');

    expect(user).toEqual({
      userId: 'google-sub-1',
      email: 'a@example.com',
      name: null,
      locale: null,
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://openidconnect.googleapis.com/v1/userinfo',
      { headers: { Authorization: 'Bearer access-token' } },
    );
  });

  it('throws when the response is not ok', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    await expect(fetchGoogleProfile('bad-token')).rejects.toThrow(
      'Failed to fetch Google profile (status 401)',
    );
  });
});
