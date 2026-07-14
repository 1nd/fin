import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <IconButton name="trash-outline" accessibilityLabel="Delete" onPress={onPress} />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByLabelText('Delete'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <IconButton name="trash-outline" accessibilityLabel="Delete" onPress={onPress} disabled />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByLabelText('Delete'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
