import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../lib/useNotifications';
import { cartCount, useShop } from '../../store/useShop';
import { C } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(active: IconName, inactive: IconName) {
  return ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? active : inactive} color={color} size={size} />
  );
}

export default function TabLayout() {
  const count = useShop(cartCount);
  const { unread } = useNotifications();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        // The default 48px web bar clips label descenders; leave room for icon,
        // label and the home-indicator area.
        tabBarStyle: { height: 62 + insets.bottom, paddingBottom: insets.bottom, backgroundColor: C.card, borderTopColor: C.line },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="live" options={{ title: 'Live', tabBarIcon: icon('videocam', 'videocam-outline') }} />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarLabel: 'Alerts',
          tabBarIcon: icon('notifications', 'notifications-outline'),
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: C.primary, fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: icon('cart', 'cart-outline'),
          tabBarBadge: count > 0 ? (count > 99 ? '99+' : count) : undefined,
          tabBarBadgeStyle: { backgroundColor: C.primary, fontSize: 10 },
        }}
      />
      <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}
