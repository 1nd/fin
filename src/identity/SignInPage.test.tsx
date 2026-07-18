import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from '../i18n/i18n';
import { IdentityContextProvider } from './IdentityContext';
import { IdentityUseCase } from './identityUseCase';
import type { IdentityProvider, IdentitySignInResult } from './identityProviderPorts';
import { InMemorySessionStore } from './testing/identityMock';
import { SignInPage } from './SignInPage';

const BUTTON_MARKER = 'google-button-rendered';

// Rejects the first render (simulating a script-load/config failure — no affordance ever
// reaches the DOM), then succeeds on every later attempt.
class FlakyRenderIdentityProvider implements IdentityProvider {
  private attempts = 0;

  async renderInto(container: HTMLElement): Promise<void> {
    this.attempts += 1;
    if (this.attempts === 1) {
      throw new Error('Failed to load Google Sign-In');
    }
    container.textContent = BUTTON_MARKER;
  }

  onIdentity(): () => void {
    return () => {};
  }
}

// Renders successfully (leaving a real, clickable affordance behind) and exposes a way to
// manually deliver a later rejection through the same subscription — simulates a rejected
// token after the button already rendered (the multi-fire regime the button itself retries).
class RenderedThenRejectedIdentityProvider implements IdentityProvider {
  private listener: ((result: IdentitySignInResult) => void) | undefined;

  async renderInto(container: HTMLElement): Promise<void> {
    container.textContent = BUTTON_MARKER;
  }

  onIdentity(listener: (result: IdentitySignInResult) => void): () => void {
    this.listener = listener;
    return () => {
      this.listener = undefined;
    };
  }

  rejectLatestAttempt(): void {
    this.listener?.({ ok: false, error: new Error('bad token') });
  }
}

describe('SignInPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('offers a retry affordance when the button never rendered, and retrying succeeds', async () => {
    await i18next.changeLanguage('en');
    const useCase = new IdentityUseCase(
      new FlakyRenderIdentityProvider(),
      new InMemorySessionStore(),
    );
    const user = userEvent.setup();
    render(
      <IdentityContextProvider useCase={useCase}>
        <SignInPage />
      </IdentityContextProvider>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Sign-in didn't complete. Please try again.",
    );
    const retryButton = await screen.findByRole('button', { name: 'Try again' });

    await user.click(retryButton);

    expect(await screen.findByText(BUTTON_MARKER)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('does not offer a retry affordance when the button already rendered — it is already clickable itself', async () => {
    await i18next.changeLanguage('en');
    const provider = new RenderedThenRejectedIdentityProvider();
    const useCase = new IdentityUseCase(provider, new InMemorySessionStore());
    render(
      <IdentityContextProvider useCase={useCase}>
        <SignInPage />
      </IdentityContextProvider>,
    );
    await screen.findByText(BUTTON_MARKER);

    provider.rejectLatestAttempt();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Sign-in didn't complete. Please try again.",
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});
