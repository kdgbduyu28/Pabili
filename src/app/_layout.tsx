import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Overlays } from '../components/Overlays';
import { Watcher } from '../components/Watcher';
import { C } from '../theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="search" options={{ animation: 'fade' }} />
          </Stack>
          <Overlays />
          <Watcher />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
