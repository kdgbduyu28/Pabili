import { LinearGradient } from 'expo-linear-gradient';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { themed } from '../theme';

type Props = {
  emoji: string;
  gradient: [string, string];
  size: number;
  radius?: number;
  angle?: number;
  style?: StyleProp<ViewStyle>;
};

const ANGLES: { start: { x: number; y: number }; end: { x: number; y: number } }[] = [
  { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
  { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
];

/** Products are emoji on a soft gradient, so there are no photos to license or host. */
export function ProductImage({ emoji, gradient, size, radius = 0, angle = 0, style }: Props) {
  const a = ANGLES[angle % ANGLES.length];
  return (
    <LinearGradient
      colors={gradient}
      start={a.start}
      end={a.end}
      style={[styles.box, { width: size, height: size, borderRadius: radius }, style]}
    >
      <Text style={{ fontSize: size * 0.48 }} allowFontScaling={false}>
        {emoji}
      </Text>
    </LinearGradient>
  );
}

const styles = themed(() => ({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
}));
