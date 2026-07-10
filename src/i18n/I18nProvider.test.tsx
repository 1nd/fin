import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { LanguageSelector } from '@/features/settings/LanguageSelector';
import { I18nProvider } from './I18nProvider';

function renderInLanguage(language: 'en' | 'id') {
  return render(
    <I18nProvider language={language}>
      <ThemeProvider>
        <LanguageSelector value={language} onChange={() => {}} />
      </ThemeProvider>
    </I18nProvider>,
  );
}

describe('I18nProvider render smoke test', () => {
  it('renders translated English text, not raw i18n keys', async () => {
    await renderInLanguage('en');
    expect(screen.getByText('Language')).toBeTruthy();
    expect(screen.getByText('English')).toBeTruthy();
    expect(screen.queryByText('settings.language.label')).toBeNull();
  });

  it('renders translated Indonesian text, not raw i18n keys', async () => {
    await renderInLanguage('id');
    expect(screen.getByText('Bahasa')).toBeTruthy();
    expect(screen.getByText('Bahasa Indonesia')).toBeTruthy();
    expect(screen.queryByText('settings.language.label')).toBeNull();
  });
});
