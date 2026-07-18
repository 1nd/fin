import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IDBFactory } from 'fake-indexeddb';
import type { ReactNode } from 'react';
import i18next from '../i18n/i18n';
import { IdentityContextProvider, useIdentity } from '../identity/IdentityContext';
import { IdentityUseCase } from '../identity/identityUseCase';
import type { IdentityProvider as IdentityProviderPort } from '../identity/identityProviderPorts';
import { identityUseCaseFor, InMemorySessionStore } from '../identity/testing/identityMock';
import type { UserIdentity } from '../identity/userIdentity';
import { closeDb } from '../storage/db';
import { PreferencesProvider, usePreferences } from './PreferencesContext';
import { FALLBACK_PREFERENCES, type Preferences } from './preferences';
import { SettingsPage } from './SettingsPage';
import { SettingsUseCase } from './settingsUseCase';

const USER_A: UserIdentity = { userId: 'user-a', displayName: 'A', email: 'a@example.com' };

function withIdentity(identity: UserIdentity | null, children: ReactNode) {
  return (
    <IdentityContextProvider useCase={identityUseCaseFor(identity)}>
      {children}
    </IdentityContextProvider>
  );
}

// Resolves each successive signIn() call with the next queued identity —
// simulates a user signing out and back in as a different Google account.
class QueuedIdentityProvider implements IdentityProviderPort {
  private readonly queue: UserIdentity[];

  constructor(identities: UserIdentity[]) {
    this.queue = [...identities];
  }

  async signIn(): Promise<UserIdentity> {
    const next = this.queue.shift();
    if (!next) throw new Error('no more identities queued');
    return next;
  }
}

function IdentityControls() {
  const { signIn, signOut } = useIdentity();
  return (
    <div>
      <button type="button" onClick={() => void signIn(document.createElement('div'))}>
        sign-in
      </button>
      <button type="button" onClick={signOut}>
        sign-out
      </button>
    </div>
  );
}

function Probe() {
  const { preferences, setPreference } = usePreferences();
  return (
    <div>
      <span data-testid="language">{preferences.language}</span>
      <span data-testid="dateFormat">{preferences.dateFormat}</span>
      <button type="button" onClick={() => setPreference('language', 'id')}>
        set-language
      </button>
    </div>
  );
}

describe('PreferencesProvider', () => {
  beforeEach(async () => {
    await i18next.changeLanguage('en');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not let the in-flight initial load revert a preference set before it resolved', async () => {
    let resolveLoad!: (value: Preferences) => void;
    vi.spyOn(SettingsUseCase.prototype, 'getEffectivePreferences').mockReturnValue(
      new Promise<Preferences>((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const setOverride = vi
      .spyOn(SettingsUseCase.prototype, 'setOverride')
      .mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(
      withIdentity(
        USER_A,
        <PreferencesProvider>
          <Probe />
        </PreferencesProvider>,
      ),
    );

    await user.click(screen.getByRole('button', { name: 'set-language' }));
    expect(screen.getByTestId('language')).toHaveTextContent('id');
    expect(setOverride).toHaveBeenCalledWith('language', 'id');

    // The load resolves after the user's change, with a snapshot that predates it.
    await act(async () => {
      resolveLoad({
        language: 'en',
        numberFormat: 'period-decimal',
        dateFormat: 'DD-MM-YYYY',
        theme: 'dark',
      });
    });

    // The user's optimistic change survives; the rest of the snapshot still applies.
    expect(screen.getByTestId('language')).toHaveTextContent('id');
    expect(screen.getByTestId('dateFormat')).toHaveTextContent('DD-MM-YYYY');
  });

  it('surfaces a failed preference write on the settings page and clears it after a later successful save', async () => {
    vi.spyOn(SettingsUseCase.prototype, 'getEffectivePreferences').mockResolvedValue(
      FALLBACK_PREFERENCES,
    );
    const setOverride = vi
      .spyOn(SettingsUseCase.prototype, 'setOverride')
      .mockRejectedValue(new Error('quota exceeded'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const user = userEvent.setup();
    render(
      withIdentity(
        USER_A,
        <PreferencesProvider>
          <SettingsPage />
        </PreferencesProvider>,
      ),
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Date format'), 'DD-MM-YYYY');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't save your settings. Changes may be lost when you reload.",
    );
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to persist preference "dateFormat"',
      expect.any(Error),
    );
    // The in-session state keeps the user's choice; only durability failed.
    expect(screen.getByLabelText('Date format')).toHaveValue('DD-MM-YYYY');

    setOverride.mockResolvedValue(undefined);
    await user.selectOptions(screen.getByLabelText('Date format'), 'MM-DD-YYYY');

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('keeps the notice while any key remains unsaved, even after another key saves successfully', async () => {
    vi.spyOn(SettingsUseCase.prototype, 'getEffectivePreferences').mockResolvedValue(
      FALLBACK_PREFERENCES,
    );
    const setOverride = vi
      .spyOn(SettingsUseCase.prototype, 'setOverride')
      .mockImplementation((key) =>
        key === 'dateFormat' ? Promise.reject(new Error('quota exceeded')) : Promise.resolve(),
      );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const user = userEvent.setup();
    render(
      withIdentity(
        USER_A,
        <PreferencesProvider>
          <SettingsPage />
        </PreferencesProvider>,
      ),
    );

    await user.selectOptions(screen.getByLabelText('Date format'), 'DD-MM-YYYY');
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    // A different key saves successfully; the failed key is still unsaved.
    await user.selectOptions(screen.getByLabelText('Number format'), 'comma-decimal');
    await waitFor(() => {
      expect(setOverride).toHaveBeenLastCalledWith('numberFormat', 'comma-decimal');
    });
    await act(async () => {});

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('degrades to cascade defaults when the initial load fails: logged, usable, no save notice', async () => {
    vi.spyOn(SettingsUseCase.prototype, 'getEffectivePreferences').mockRejectedValue(
      new Error('db open failed'),
    );
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      withIdentity(
        USER_A,
        <PreferencesProvider>
          <SettingsPage />
        </PreferencesProvider>,
      ),
    );

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to load stored preferences',
        expect.any(Error),
      );
    });

    // Cascade-derived defaults render and the page stays usable.
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('Date format')).toHaveValue('YYYY-MM-DD');
    // A load failure is not a save failure — no notice.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('resolves defaults from the account locale ahead of browser locale', async () => {
    const idAccount: UserIdentity = {
      userId: 'user-id-locale',
      displayName: 'Budi',
      email: 'budi@example.com',
      locale: 'id-ID',
    };

    render(
      withIdentity(
        idAccount,
        <PreferencesProvider>
          <Probe />
        </PreferencesProvider>,
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('language')).toHaveTextContent('id');
    });
  });

  it("switching to a second account does not see the first account's override", async () => {
    await closeDb();
    (globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();

    const accountA: UserIdentity = {
      userId: 'account-a',
      displayName: 'A',
      email: 'a@example.com',
    };
    const accountB: UserIdentity = {
      userId: 'account-b',
      displayName: 'B',
      email: 'b@example.com',
    };
    // accountA comes from the restored session below; the queue only needs
    // to supply what a later signIn() call resolves to.
    const useCase = new IdentityUseCase(
      new QueuedIdentityProvider([accountB]),
      new InMemorySessionStore(accountA),
    );

    const user = userEvent.setup();
    render(
      <IdentityContextProvider useCase={useCase}>
        <PreferencesProvider>
          <Probe />
          <IdentityControls />
        </PreferencesProvider>
      </IdentityContextProvider>,
    );

    // Account A sets and persists an override.
    await user.click(screen.getByRole('button', { name: 'set-language' }));
    await waitFor(() => expect(screen.getByTestId('language')).toHaveTextContent('id'));

    // Sign out, then sign in as a different account.
    await user.click(screen.getByRole('button', { name: 'sign-out' }));
    await user.click(screen.getByRole('button', { name: 'sign-in' }));

    // Account B does not inherit account A's override; its own cascade applies.
    await waitFor(() => {
      expect(screen.getByTestId('language')).toHaveTextContent('en');
    });
  });
});
