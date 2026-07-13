import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AuthContext, type AuthContextValue } from './auth-context';
import { SignInScreen } from './SignInScreen';

function renderScreen(error: string | null = null) {
  const value: AuthContextValue = {
    status: 'signed-out',
    error,
    canSignIn: true,
    signIn: jest.fn(),
    signOut: jest.fn(),
  };
  return render(
    <I18nProvider language="en">
      <ThemeProvider>
        <AuthContext.Provider value={value}>
          <SignInScreen />
        </AuthContext.Provider>
      </ThemeProvider>
    </I18nProvider>,
  );
}

describe('SignInScreen render smoke test', () => {
  it('renders translated sign-in messaging and the sign-in button', async () => {
    await renderScreen();
    expect(screen.getByText('Welcome to Fin')).toBeTruthy();
    expect(screen.getByText('Sign in with Google')).toBeTruthy();
  });

  it('surfaces a sign-in error when one is present', async () => {
    await renderScreen('Sign-in failed.');
    expect(screen.getByText('Sign-in failed.')).toBeTruthy();
  });
});
