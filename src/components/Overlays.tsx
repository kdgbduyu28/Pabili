import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useUi } from '../store/useUi';
import { Coin } from './Icon';
import { ProductImage } from './ProductImage';
import { themed } from '../theme';

/** App-wide layer for the centered toast and items flying into the cart. */
export function Overlays() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Flights />
      <ToastView />
    </View>
  );
}

function ToastView() {
  const toast = useUi((s) => s.toast);
  const hide = useUi((s) => s.hideToast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => hide(toast.id), 1600);
    return () => clearTimeout(t);
  }, [toast, hide]);
  if (!toast) return null;
  return (
    <View style={styles.toastWrap}>
      <Animated.View key={toast.id} entering={ZoomIn.springify().damping(14)} exiting={FadeOut} style={styles.toast}>
        {toast.icon === 'coin' ? (
          <Coin size={40} />
        ) : (
          <Ionicons name={toast.icon ?? 'checkmark-circle'} size={44} color="#fff" />
        )}
        <Text style={styles.toastText}>{toast.text}</Text>
      </Animated.View>
    </View>
  );
}

function Flights() {
  const flights = useUi((s) => s.flights);
  return (
    <>
      {flights.map((f) => (
        <Flight key={f.id} {...f} />
      ))}
    </>
  );
}

const SIZE = 56;

function Flight({ id, emoji, gradient, from, to }: ReturnType<typeof useUi.getState>['flights'][number]) {
  const land = useUi((s) => s.landFlight);
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withTiming(1, { duration: 700, easing: Easing.inOut(Easing.cubic) }, (done) => {
      if (done) scheduleOnRN(land, id);
    });
  }, [id, land, t]);

  const style = useAnimatedStyle(() => {
    const p = t.value;
    // Arc upward: straight line plus a parabola bump.
    const x = from.x + (to.x - from.x) * p;
    const y = from.y + (to.y - from.y) * p - Math.sin(p * Math.PI) * 120;
    const s = 1 - 0.75 * p;
    return {
      opacity: p > 0.95 ? (1 - p) * 20 : 1,
      transform: [{ translateX: x - SIZE / 2 }, { translateY: y - SIZE / 2 }, { scale: s }, { rotate: `${p * 360}deg` }],
    };
  });

  return (
    <Animated.View entering={FadeIn.duration(80)} style={[styles.flight, style]}>
      <ProductImage emoji={emoji} gradient={gradient} size={SIZE} radius={SIZE / 2} />
    </Animated.View>
  );
}

const styles = themed(() => ({
  toastWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  toast: {
    backgroundColor: 'rgba(20,20,20,0.82)',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 22,
    alignItems: 'center',
    gap: 8,
    minWidth: 150,
    maxWidth: 260,
  },
  toastText: { color: '#fff', fontSize: 14, textAlign: 'center' },
  flight: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SIZE,
    height: SIZE,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
}));
