import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IDBFactory } from 'fake-indexeddb';
import { BrowserRouter, MemoryRouter } from 'react-router';
import i18next from '../i18n/i18n';
import { SESSION_STORAGE_KEY } from '../identity/session/localStorageSessionStore';
import type { UserIdentity } from '../identity/userIdentity';
import { closeDb } from '../storage/db';
import App from './App';

// These tests exercise routing/i18n, not identity, so they run pre-signed-in:
// seed the real LocalStorageSessionStore's key the same way a completed
// Google Sign-In would have (identity concerns are covered by Gate.test.tsx).
const TEST_USER: UserIdentity = {
  userId: 'test-user',
  displayName: 'Test User',
  email: 'test-user@example.com',
};

describe('App', () => {
  beforeEach(async () => {
    await closeDb();
    (globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(TEST_USER));
    await i18next.changeLanguage('en');
  });

  afterEach(() => {
    cleanup();
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    // The history-traversal test drives real window.history; reset the URL so
    // tests that run after it don't inherit its final location.
    window.history.replaceState(null, '', '/');
  });

  it('renders the shell and flips a visible string when the language changes', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Fin')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Settings' }));
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Language'), 'id');

    expect(await screen.findByRole('heading', { name: 'Pengaturan' })).toBeInTheDocument();
  });

  it('renders Settings when entering directly at /settings', async () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('marks the active nav entry from the URL as it navigates in-app', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    const homeLink = await screen.findByRole('link', { name: 'Home' });
    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    expect(homeLink).toHaveAttribute('aria-current', 'page');
    expect(settingsLink).not.toHaveAttribute('aria-current');

    await user.click(settingsLink);

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(settingsLink).toHaveAttribute('aria-current', 'page');
    expect(homeLink).not.toHaveAttribute('aria-current');
  });

  it('renders a localized not-found view for an unknown path', async () => {
    render(
      <MemoryRouter initialEntries={['/nope']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Home' })).toBeInTheDocument();
  });

  it('traverses browser history back and forward between views', async () => {
    window.history.replaceState(null, '', '/');
    const user = userEvent.setup();
    render(
      // BrowserRouter, unlike every other test here: the behavior under test
      // is integration with the real `window.history` back/forward stack, which
      // MemoryRouter deliberately bypasses.
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    await user.click(await screen.findByRole('link', { name: 'Settings' }));
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();

    act(() => {
      window.history.back();
    });
    expect(await screen.findByText('Welcome to Fin')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');

    act(() => {
      window.history.forward();
    });
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/settings');
  });
});
