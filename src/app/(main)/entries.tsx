// CCA: 4
import { View } from 'react-native';
import { Screen } from '@/shared-ui/Screen';
import { Text } from '@/shared-ui/Text';

export default function EntriesRoute() {
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Entries (placeholder)</Text>
      </View>
    </Screen>
  );
}
