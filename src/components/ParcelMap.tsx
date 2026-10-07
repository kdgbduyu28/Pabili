import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { hash, rng } from '../data/catalog';
import { C, R } from '../theme';

const H = 190;

type Pt = { x: number; y: number };

function pointAt(pts: Pt[], t: number): Pt {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  let d = seg.reduce((a, b) => a + b, 0) * Math.max(0, Math.min(1, t));
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const k = seg[i] ? d / seg[i] : 0;
      return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k };
    }
    d -= seg[i];
  }
  return pts[pts.length - 1];
}

function path(pts: Pt[]) {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

/** A drawn city map with the rider moving from the hub to your pin. */
export function ParcelMap({ orderId, progress, etaMs, outForDelivery }: { orderId: string; progress: number; etaMs: number; outForDelivery: boolean }) {
  const [w, setW] = useState(0);
  const r = rng(hash(`map:${orderId}`));
  // Route along a street grid: right, up, right, up… so it reads like real roads.
  const route: Pt[] = [];
  if (w) {
    let x = 24;
    let y = H - 28;
    route.push({ x, y });
    for (let i = 0; i < 4; i++) {
      x += (w - 60) / 4;
      route.push({ x, y });
      y -= 20 + r() * 25;
      route.push({ x, y: Math.max(28, y) });
    }
  }
  const pts = route.map((p) => ({ ...p, y: Math.max(28, p.y) }));
  const traveledEnd = w ? pointAt(pts, progress) : { x: 0, y: 0 };
  const traveled: Pt[] = [];
  if (w) {
    let acc = 0;
    const total = pts.slice(1).reduce((n, p, i) => n + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);
    traveled.push(pts[0]);
    for (let i = 1; i < pts.length; i++) {
      acc += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (acc / total >= progress) break;
      traveled.push(pts[i]);
    }
    traveled.push(traveledEnd);
  }
  const home = pts[pts.length - 1];
  const mins = Math.max(1, Math.ceil(etaMs / 60000));

  return (
    <View style={styles.wrap}>
      <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} style={{ height: H, borderRadius: R.md, overflow: 'hidden' }}>
        {w > 0 && (
          <Svg width={w} height={H}>
            <Rect x={0} y={0} width={w} height={H} fill="#EEF2F6" />
            <Rect x={w * 0.55} y={12} width={w * 0.22} height={50} rx={8} fill="#D9F2DF" />
            <Path d={`M0,${H * 0.42} C${w * 0.3},${H * 0.3} ${w * 0.5},${H * 0.62} ${w},${H * 0.5}`} stroke="#CFE6F7" strokeWidth={14} fill="none" />
            {Array.from({ length: 6 }, (_, i) => (
              <Line key={`v${i}`} x1={(w / 6) * i + 20} x2={(w / 6) * i + 20} y1={0} y2={H} stroke="#fff" strokeWidth={6} />
            ))}
            {Array.from({ length: 4 }, (_, i) => (
              <Line key={`h${i}`} x1={0} x2={w} y1={(H / 4) * i + 24} y2={(H / 4) * i + 24} stroke="#fff" strokeWidth={6} />
            ))}
            <Path d={path(pts)} stroke="#CBD5E1" strokeWidth={4} fill="none" strokeLinejoin="round" strokeDasharray="6 6" />
            <Path d={path(traveled)} stroke={C.ship} strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={pts[0].x} cy={pts[0].y} r={6} fill="#fff" stroke={C.muted} strokeWidth={2} />
          </Svg>
        )}
        {w > 0 && (
          <>
            <View style={[styles.pin, { left: home.x - 14, top: home.y - 30 }]}>
              <Ionicons name="home" size={16} color="#fff" />
            </View>
            <View style={[styles.rider, { left: traveledEnd.x - 16, top: traveledEnd.y - 16 }]}>
              <Ionicons name="bicycle" size={18} color="#fff" />
            </View>
            <Text style={[styles.label, { left: pts[0].x - 10, top: pts[0].y + 8 }]}>Hub</Text>
          </>
        )}
      </View>
      <View style={styles.eta}>
        <Ionicons name={outForDelivery ? 'bicycle' : 'business-outline'} size={16} color={C.ship} />
        <Text style={styles.etaText}>
          {outForDelivery ? `Rider is on the way · arriving in about ${mins} min` : `Heading to the sorting hub · delivery in about ${mins} min`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  pin: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  rider: { position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: C.ship, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  label: { position: 'absolute', fontSize: 10, color: C.muted, fontWeight: '600' },
  eta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  etaText: { fontSize: 12, color: C.ship, fontWeight: '600', flex: 1 },
});
