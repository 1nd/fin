import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Input } from './Input';

function renderInput(props: React.ComponentProps<typeof Input> = {}) {
  return render(
    <ThemeProvider>
      <Input placeholder="Category name" {...props} />
    </ThemeProvider>,
  );
}

describe('Input', () => {
  it('renders the placeholder and reports text changes', async () => {
    const onChangeText = jest.fn();
    await renderInput({ onChangeText });

    const input = screen.getByPlaceholderText('Category name');
    fireEvent.changeText(input, 'Groceries');

    expect(onChangeText).toHaveBeenCalledWith('Groceries');
  });

  it('tracks focus state without breaking caller focus/blur handlers', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await renderInput({ onFocus, onBlur });

    const input = screen.getByPlaceholderText('Category name');
    fireEvent(input, 'focus');
    fireEvent(input, 'blur');

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
