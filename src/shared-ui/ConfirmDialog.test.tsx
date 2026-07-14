import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ConfirmDialog } from './ConfirmDialog';

async function renderDialog(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  await render(
    <I18nProvider language="en">
      <ThemeProvider>
        <ConfirmDialog
          visible
          title="Delete category?"
          message="This cannot be undone."
          onConfirm={onConfirm}
          onCancel={onCancel}
          {...props}
        />
      </ThemeProvider>
    </I18nProvider>,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('renders nothing when not visible', async () => {
    await render(
      <I18nProvider language="en">
        <ThemeProvider>
          <ConfirmDialog
            visible={false}
            title="Delete category?"
            message="This cannot be undone."
            onConfirm={jest.fn()}
            onCancel={jest.fn()}
          />
        </ThemeProvider>
      </I18nProvider>,
    );

    expect(screen.queryByText('Delete category?')).toBeNull();
  });

  it('shows the title and message when visible', async () => {
    await renderDialog();

    expect(screen.getByText('Delete category?')).toBeTruthy();
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
  });

  it('calls onConfirm when the confirm button is pressed', async () => {
    const { onConfirm } = await renderDialog({ confirmLabel: 'Delete' });

    fireEvent.press(screen.getByText('Delete'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the cancel button is pressed', async () => {
    const { onCancel } = await renderDialog();

    fireEvent.press(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the overlay is tapped', async () => {
    const { onCancel } = await renderDialog();

    fireEvent.press(screen.getByTestId('confirm-dialog-overlay'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when the dialog card itself is tapped', async () => {
    const { onCancel } = await renderDialog();

    fireEvent.press(screen.getByTestId('confirm-dialog-card'));

    expect(onCancel).not.toHaveBeenCalled();
  });
});
