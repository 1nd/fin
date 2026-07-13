// CCA: 4
import { StyleSheet, Text, View } from 'react-native';

export default function DashboardRoute() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dashboard (placeholder)</Text>
    </View>
  );
}

// Hard-coded to match darkTheme (theme/dark.ts) — no ThemeProvider mounted yet (task 3.5). Replace with useTheme() then.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  text: {
    color: '#F5F5F5',
  },
});
