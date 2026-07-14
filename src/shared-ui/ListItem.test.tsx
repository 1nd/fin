import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ListItem } from './ListItem';

describe('ListItem', () => {
  it('renders content and trailing actions', async () => {
    await render(
      <ThemeProvider>
        <ListItem actions={<Text>Action</Text>}>
          <Text>Row content</Text>
        </ListItem>
      </ThemeProvider>,
    );

    expect(screen.getByText('Row content')).toBeTruthy();
    expect(screen.getByText('Action')).toBeTruthy();
  });

  it('calls onPress when the row is pressable', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider>
        <ListItem onPress={onPress}>
          <Text>Row content</Text>
        </ListItem>
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText('Row content'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
