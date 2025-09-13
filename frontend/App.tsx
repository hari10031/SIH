import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Location from './Location';
export default function App() {
  return (
    <View style={styles.container}>
      {/* <Text>This is a text</Text> */}
      <StatusBar style="auto" />
      <Location />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
