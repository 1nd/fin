import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IDBFactory } from 'fake-indexeddb';
import { MemoryRouter } from 'react-router';
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
