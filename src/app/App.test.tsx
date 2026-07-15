import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  it('renders the shell and flips a visible string when the language changes', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText('Fin')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Language'), 'id');

    expect(await screen.findByRole('heading', { name: 'Pengaturan' })).toBeInTheDocument();
  });
});
