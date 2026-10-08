import { useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { PricePoint } from '../data/extras';
import { peso, shortDate } from '../lib/format';
import { C, themed } from '../theme';

const H = 110;
const PAD_X = 10;
const PAD_Y = 14;
const LINE = C.primaryDark;
const GRID = '#ECECEE';

/** 30-day price steps. Touch and drag to read any day; the lowest day and today are marked. */
export function PriceChart({ points }: { points: PricePoint[] }) {
  const [w, setW] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const prices = points.map((p) => p.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const span = hi - lo || 1;
  const lowIdx = prices.lastIndexOf(lo);
  const today = points.length - 1;

  const x = (i: number) => PAD_X + (i / (points.length - 1)) * (w - PAD_X * 2);
  const y = (v: number) => PAD_Y + (1 - (v - lo) / span) * (H - PAD_Y * 2);
  // A price holds for the whole day, so draw steps rather than slopes between days.
  const d = points
    .map((p, i) => (i ? `H${x(i).toFixed(1)} V${y(p.price).toFixed(1)}` : `M${x(0).toFixed(1)},${y(p.price).toFixed(1)}`))
    .join(' ');

  const pick = (e: GestureResponderEvent) => {
    if (!w) return;
    const i = Math.round(((e.nativeEvent.locationX - PAD_X) / (w - PAD_X * 2)) * (points.length - 1));
    setActive(Math.max(0, Math.min(points.length - 1, i)));
  };

  const shown = active ?? null;
  const tipLeft = shown === null ? 0 : Math.max(0, Math.min(w - 110, x(shown) - 55));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={pick}
      onResponderMove={pick}
      onResponderRelease={() => setActive(null)}
      onResponderTerminate={() => setActive(null)}
      accessibilityLabel={`Price over the last 30 days: lowest ${peso(lo)}, highest ${peso(hi)}, today ${peso(prices[today])}`}
      style={{ height: H + 18 }}
    >
      {w > 0 && (
        <Svg width={w} height={H}>
          <Line x1={PAD_X} x2={w - PAD_X} y1={y(hi)} y2={y(hi)} stroke={GRID} strokeWidth={1} />
          <Line x1={PAD_X} x2={w - PAD_X} y1={y(lo)} y2={y(lo)} stroke={GRID} strokeWidth={1} />
          <Path d={d} stroke={LINE} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {shown !== null && <Line x1={x(shown)} x2={x(shown)} y1={PAD_Y / 2} y2={H - PAD_Y / 2} stroke={C.faint} strokeWidth={1} />}
          {[lowIdx, today, ...(shown !== null ? [shown] : [])].map((i, k) => (
            <Circle key={`${i}-${k}`} cx={x(i)} cy={y(prices[i])} r={4} fill={LINE} stroke="#fff" strokeWidth={2} />
          ))}
        </Svg>
      )}
      {w > 0 && (
        <View style={styles.labels} pointerEvents="none">
          <Text style={styles.label}>{shortDate(new Date(points[0].at))}</Text>
          <Text style={styles.label}>Today</Text>
        </View>
      )}
      {shown !== null && (
        <View pointerEvents="none" style={[styles.tip, { left: tipLeft }]}>
          <Text style={styles.tipDate}>{shown === today ? 'Today' : shortDate(new Date(points[shown].at))}</Text>
          <Text style={styles.tipPrice}>{peso(prices[shown])}</Text>
        </View>
      )}
    </View>
  );
}

const styles = themed(() => ({
  labels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: PAD_X },
  label: { fontSize: 10, color: C.faint },
  tip: { position: 'absolute', top: 0, width: 110, backgroundColor: C.text, borderRadius: 6, paddingVertical: 4, alignItems: 'center' },
  tipDate: { color: '#D4D4D8', fontSize: 10 },
  tipPrice: { color: '#fff', fontSize: 13, fontWeight: '700' },
}));
