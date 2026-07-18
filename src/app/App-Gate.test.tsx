import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IDBFactory } from 'fake-indexeddb';
import { MemoryRouter, useLocation } from 'react-router';
import i18next from '../i18n/i18n';
import { closeDb } from '../storage/db';
import { IdentityContextProvider } from '../identity/IdentityContext';
import { IdentityUseCase } from '../identity/identityUseCase';
import {
  FixedIdentityProvider,
  identityUseCaseFor,
  InMemorySessionStore,
  PendingIdentityProvider,
} from '../identity/testing/identityMock';
import type { UserIdentity } from '../identity/userIdentity';
import { Gate } from './App';

const ALICE: UserIdentity = {
  userId: 'google-sub-alice',
  displayName: 'Alice',
  email: 'alice@example.com',
};

// Renders the full current URL (path + query + hash) so tests can assert it survives
// the gate untouched — the gate is a conditional render, never a redirect, so this
// should hold both while signed out and after sign-in completes.
function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
      {location.hash}
    </div>
  );
}

describe('App Gate', () => {
  beforeEach(async () => {
    await closeDb();
    (globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
    await i18next.changeLanguage('en');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the sign-in screen when signed out and no app view renders', async () => {
    const useCase = new IdentityUseCase(new PendingIdentityProvider(), new InMemorySessionStore());
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <IdentityContextProvider useCase={useCase}>
          <Gate />
        </IdentityContextProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Sign in to Fin' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Settings' })).not.toBeInTheDocument();
    // A dismissed/still-pending attempt (`PendingIdentityProvider` never delivers) gets no
    // notice — Google Identity Services gives no signal for a bare popup dismissal, so
    // nothing here should read as an error either.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the sign-in screen entirely in Indonesian when the browser locale is Indonesian', async () => {
    // The sign-in screen has no signed-in account to source a locale from, so it must get
    // there via PreferencesProvider's browser-cascade path (`userId: null`, `google-signin`
    // D5) — this is what regressed when the gate rendered SignInPage bare, outside
    // PreferencesProvider, leaving i18next stuck on whatever it was last set to.
    const originalLanguage = window.navigator.language;
    Object.defineProperty(window.navigator, 'language', { value: 'id-ID', configurable: true });

    try {
      const useCase = new IdentityUseCase(
        new PendingIdentityProvider(),
        new InMemorySessionStore(),
      );
      render(
        <MemoryRouter initialEntries={['/']}>
          <IdentityContextProvider useCase={useCase}>
            <Gate />
          </IdentityContextProvider>
        </MemoryRouter>,
      );

      expect(await screen.findByRole('heading', { name: 'Login ke Fin' })).toBeInTheDocument();
      expect(
        screen.getByText('Login dengan akun Google Anda untuk melanjutkan.'),
      ).toBeInTheDocument();
      expect(screen.queryByText('Sign in to Fin')).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(window.navigator, 'language', {
        value: originalLanguage,
        configurable: true,
      });
    }
  });

  it('lands on the originally requested view once sign-in completes', async () => {
    const useCase = new IdentityUseCase(
      new FixedIdentityProvider(ALICE),
      new InMemorySessionStore(),
    );
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <IdentityContextProvider useCase={useCase}>
          <Gate />
        </IdentityContextProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('preserves the query string and hash across sign-in', async () => {
    const requestedUrl = '/settings?tab=lorem#ipsum';
    const useCase = new IdentityUseCase(
      new FixedIdentityProvider(ALICE),
      new InMemorySessionStore(),
    );
    render(
      <MemoryRouter initialEntries={[requestedUrl]}>
        <IdentityContextProvider useCase={useCase}>
          <Gate />
        </IdentityContextProvider>
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/settings?tab=lorem#ipsum');
  });

  it('keeps the full requested URL intact while the sign-in screen is shown', async () => {
    const requestedUrl = '/settings?tab=lorem#ipsum';
    const useCase = new IdentityUseCase(new PendingIdentityProvider(), new InMemorySessionStore());
    render(
      <MemoryRouter initialEntries={[requestedUrl]}>
        <IdentityContextProvider useCase={useCase}>
          <Gate />
        </IdentityContextProvider>
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Sign in to Fin' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/settings?tab=lorem#ipsum');
  });

  it('returns to the gate when the signed-in user signs out', async () => {
    const useCase = identityUseCaseFor(ALICE);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <IdentityContextProvider useCase={useCase}>
          <Gate />
        </IdentityContextProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Welcome to Fin')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in to Fin' })).toBeInTheDocument();
  });
});
