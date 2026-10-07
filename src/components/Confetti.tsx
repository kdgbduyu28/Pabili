import { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { rng } from '../data/catalog';

const COLORS = ['#F43F5E', '#FB7A3C', '#FACC15', '#22C55E', '#38BDF8', '#A855F7', '#EC4899'];

export function Confetti({ count = 70, seed = 1 }: { count?: number; seed?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => ({
      i,
      x: r() * width,
      drift: (r() - 0.5) * 160,
      delay: r() * 500,
      duration: 1800 + r() * 1600,
      spin: (r() - 0.5) * 1440,
      w: 6 + r() * 6,
      h: 10 + r() * 8,
      color: COLORS[Math.floor(r() * COLORS.length)],
      round: r() > 0.7,
    }));
  }, [count, seed, width]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <Piece key={p.i} {...p} fall={height + 40} />
      ))}
    </View>
  );
}

type PieceProps = {
  x: number;
  drift: number;
  delay: number;
  duration: number;
  spin: number;
  w: number;
  h: number;
  color: string;
  round: boolean;
  fall: number;
};

function Piece({ x, drift, delay, duration, spin, w, h, color, round, fall }: PieceProps) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
  }, [delay, duration, t]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : 1 - Math.max(0, t.value - 0.8) * 5,
    transform: [
      { translateX: x + drift * t.value + Math.sin(t.value * 10) * 12 },
      { translateY: -30 + fall * t.value },
      { rotate: `${spin * t.value}deg` },
      { rotateX: `${t.value * 720}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: 0, top: 0, width: w, height: round ? w : h, borderRadius: round ? w / 2 : 2, backgroundColor: color },
        style,
      ]}
    />
  );
}
