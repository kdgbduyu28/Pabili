import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Notifier } from '../components/Notifier';
import { Overlays } from '../components/Overlays';
import { Watcher } from '../components/Watcher';
import { NOTIFICATIONS_SUPPORTED } from '../lib/push';
import { useShop } from '../store/useShop';
import { C, Scheme, setScheme } from '../theme';

export default function RootLayout() {
  const system = useColorScheme();
  // Older saved settings have no theme field yet.
  const pref = useShop((s) => s.settings.theme) ?? 'system';
  const scheme: Scheme = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  // Swap the palette before anything below renders; the key re-renders the
  // whole app so every screen and cached style picks up the new colors.
  setScheme(scheme);
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: C.primary, background: C.bg, card: C.card, text: C.text, border: C.line },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <View key={scheme} style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="search" options={{ animation: 'fade' }} />
            </Stack>
            <Overlays />
            <Watcher />
            {NOTIFICATIONS_SUPPORTED && <Notifier />}
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
