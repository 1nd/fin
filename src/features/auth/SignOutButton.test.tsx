import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AuthContext, type AuthContextValue } from './auth-context';
import { SignOutButton } from './SignOutButton';

function renderButton(signOut: () => void) {
  const value: AuthContextValue = {
    status: 'signed-in',
    user: { userId: 'user-a', email: null, name: null, locale: null },
    canSignIn: true,
    signIn: jest.fn(),
    signOut,
  };
  return render(
    <I18nProvider language="en">
      <ThemeProvider>
        <AuthContext.Provider value={value}>
          <SignOutButton />
        </AuthContext.Provider>
      </ThemeProvider>
    </I18nProvider>,
  );
}

describe('SignOutButton render smoke test', () => {
  it('renders the translated label and calls signOut when pressed', async () => {
    const signOut = jest.fn();
    await renderButton(signOut);

    fireEvent.press(screen.getByText('Sign out'));

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
