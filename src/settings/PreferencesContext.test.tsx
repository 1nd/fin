import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from '../i18n/i18n';
import { PreferencesProvider, usePreferences } from './PreferencesContext';
import { FALLBACK_PREFERENCES, type Preferences } from './preferences';
import { SettingsPage } from './SettingsPage';
import { SettingsUseCase } from './settingsUseCase';

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
      <PreferencesProvider>
        <Probe />
      </PreferencesProvider>,
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
      <PreferencesProvider>
        <SettingsPage />
      </PreferencesProvider>,
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
      <PreferencesProvider>
        <SettingsPage />
      </PreferencesProvider>,
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
      <PreferencesProvider>
        <SettingsPage />
      </PreferencesProvider>,
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
});
