// CCA: 4
import { View } from 'react-native';
import { Screen } from '@/shared-ui/Screen';
import { Text } from '@/shared-ui/Text';

export default function DashboardRoute() {
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Dashboard (placeholder)</Text>
      </View>
    </Screen>
  );
}
