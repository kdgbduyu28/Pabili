import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { cartCount, useShop } from '../store/useShop';
import { Point, useUi } from '../store/useUi';
import { C, themed } from '../theme';

export function CartButton({ color = '#fff', size = 24 }: { color?: string; size?: number }) {
  const count = useShop(cartCount);
  const pulse = useUi((s) => s.cartPulse);
  const ref = useRef<View>(null);
  const scale = useSharedValue(1);

  // Register this icon as the landing spot while its screen is focused.
  useFocusEffect(
    useCallback(() => {
      const measure = () =>
        new Promise<Point | null>((resolve) => {
          if (!ref.current) return resolve(null);
          ref.current.measureInWindow((x, y, w, h) => resolve(w ? { x: x + w / 2, y: y + h / 2 } : null));
        });
      useUi.getState().setCartTarget(measure);
      return () => {
        if (useUi.getState().cartTarget === measure) useUi.getState().setCartTarget(null);
      };
    }, []),
  );

  useEffect(() => {
    if (pulse === 0) return;
    scale.value = withSequence(withSpring(1.35, { damping: 6, stiffness: 400 }), withSpring(1, { damping: 8 }));
  }, [pulse, scale]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable ref={ref} hitSlop={8} onPress={() => router.navigate('/cart')} accessibilityLabel={`Cart, ${count} items`}>
      <Animated.View style={animated}>
        <Ionicons name="cart-outline" size={size} color={color} />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = themed(() => ({
  badge: {
    position: 'absolute',
    top: -6,
    right: -9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: C.primary, fontSize: 10, fontWeight: '800' },
}));
