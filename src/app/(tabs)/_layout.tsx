import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { ColorValue } from 'react-native';
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 11 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
      <Tabs.Screen name="live" options={{ title: 'Live', tabBarIcon: icon('videocam', 'videocam-outline') }} />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
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
