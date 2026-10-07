import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, ZoomIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { Coin } from '../components/Icon';
import { Wrap, back } from '../components/Page';
import { bump, success, warn } from '../lib/haptics';
import { todayKey } from '../lib/format';
import { play } from '../lib/sound';
import { useShop } from '../store/useShop';
import { toast } from '../store/useUi';
import { C, R } from '../theme';

type Prize = { label: string; coins?: number; voucher?: string; weight: number; color: string };

const PRIZES: Prize[] = [
  { label: '5 coins', coins: 5, weight: 24, color: '#F43F5E' },
  { label: 'Try again', weight: 14, color: '#FDBA74' },
  { label: '20 coins', coins: 20, weight: 10, color: '#FB7A3C' },
  { label: '10% off', voucher: 'SPIN10', weight: 10, color: '#FDE68A' },
  { label: '10 coins', coins: 10, weight: 20, color: '#E11D48' },
  { label: 'Free ship', voucher: 'FREESHIP', weight: 8, color: '#FECDD3' },
  { label: '50 coins', coins: 50, weight: 3, color: '#BE123C' },
  { label: '2 coins', coins: 2, weight: 11, color: '#FED7AA' },
];

export const FREE_SPINS = 3;
const EXTRA_SPIN_COST = 10;
const SIZE = 300;
const SEG = 360 / PRIZES.length;

function pickPrize(): number {
  const total = PRIZES.reduce((n, p) => n + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < PRIZES.length; i++) {
    r -= PRIZES[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}

function wedge(i: number): string {
  const c = SIZE / 2;
  const r = c - 6;
  const a0 = ((i * SEG - 90) * Math.PI) / 180;
  const a1 = (((i + 1) * SEG - 90) * Math.PI) / 180;
  return `M ${c} ${c} L ${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)} Z`;
}

const DARK = new Set(['#F43F5E', '#FB7A3C', '#E11D48', '#BE123C']);

export default function Spin() {
  const insets = useSafeAreaInsets();
  const coins = useShop((s) => s.coins);
  const spins = useShop((s) => s.spins);
  const usedToday = spins.day === todayKey() ? spins.used : 0;
  const freeLeft = Math.max(0, FREE_SPINS - usedToday);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const rot = useSharedValue(0);
  const wheel = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  const finish = (i: number) => {
    const prize = PRIZES[i];
    const { addCoins, claimVoucher } = useShop.getState();
    if (prize.coins) addCoins(prize.coins);
    if (prize.voucher) claimVoucher(prize.voucher);
    useShop.getState().bumpStat('spins');
    if (prize.coins || prize.voucher) {
      success();
      play(prize.voucher ? 'tada' : 'coin');
    } else warn();
    setResult(prize);
    setSpinning(false);
  };

  const spin = () => {
    if (spinning) return;
    const s = useShop.getState();
    if (freeLeft > 0) {
      s.countDaily('spins', FREE_SPINS);
    } else if (s.coins >= EXTRA_SPIN_COST) {
      s.addCoins(-EXTRA_SPIN_COST);
    } else {
      toast(`You need ${EXTRA_SPIN_COST} coins for another spin`, 'coin');
      return;
    }
    bump();
    setResult(null);
    setSpinning(true);
    const i = pickPrize();
    // Land the middle of wedge i under the pointer at 12 o'clock.
    const target = 360 - (i * SEG + SEG / 2) + (Math.random() - 0.5) * SEG * 0.6;
    const base = rot.value - (rot.value % 360);
    rot.value = withTiming(base + 360 * 6 + target, { duration: 4200, easing: Easing.out(Easing.cubic) }, (done) => {
      if (done) scheduleOnRN(finish, i);
    });
  };

  return (
    <LinearGradient colors={['#4C1D95', '#BE185D', '#F43F5E']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}>
        <Wrap style={styles.top}>
          <Pressable onPress={back} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }} />
          <View style={styles.coinPill}>
            <Coin size={16} />
            <Text style={styles.coinText}>{coins}</Text>
          </View>
        </Wrap>
        <Wrap style={{ alignItems: 'center', paddingHorizontal: 16 }}>
          <Text style={styles.title}>Spin & Win</Text>
          <Text style={styles.sub}>
            {freeLeft > 0 ? `${freeLeft} free spin${freeLeft > 1 ? 's' : ''} left today` : `Extra spins cost ${EXTRA_SPIN_COST} coins`}
          </Text>

          <View style={{ width: SIZE, height: SIZE + 20, marginTop: 20, alignItems: 'center' }}>
            <View style={styles.pointer}>
              <Ionicons name="caret-down" size={40} color="#FACC15" />
            </View>
            <Animated.View style={[{ width: SIZE, height: SIZE, marginTop: 20 }, wheel]}>
              <Svg width={SIZE} height={SIZE}>
                <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="#FACC15" />
                {PRIZES.map((p, i) => (
                  <Path key={i} d={wedge(i)} fill={p.color} stroke="#fff" strokeWidth={2} />
                ))}
                {PRIZES.map((p, i) => (
                  <G key={`t${i}`} transform={`rotate(${i * SEG + SEG / 2} ${SIZE / 2} ${SIZE / 2})`}>
                    <SvgText
                      x={SIZE / 2}
                      y={SIZE * 0.17}
                      fill={DARK.has(p.color) ? '#fff' : '#7C2D12'}
                      fontSize={14}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {p.label}
                    </SvgText>
                  </G>
                ))}
                <Circle cx={SIZE / 2} cy={SIZE / 2} r={34} fill="#fff" stroke="#FACC15" strokeWidth={4} />
              </Svg>
            </Animated.View>
            <Pressable onPress={spin} disabled={spinning} style={styles.hub} accessibilityLabel="Spin">
              <Text style={styles.hubText}>{spinning ? '...' : 'SPIN'}</Text>
            </Pressable>
          </View>

          {result && (
            <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.result}>
              {result.coins ? <Coin size={36} /> : <Ionicons name={result.voucher ? 'ticket' : 'sad-outline'} size={36} color={C.primary} />}
              <Text style={styles.resultTitle}>
                {result.coins ? `+${result.coins} Pabili Coins!` : result.voucher ? `You won ${result.label}!` : 'So close!'}
              </Text>
              <Text style={styles.resultSub}>
                {result.voucher ? 'The voucher is in your account and applies at checkout.' : result.coins ? 'Use coins for up to 50% off at checkout.' : 'Spin again for another chance.'}
              </Text>
            </Animated.View>
          )}

          <Pressable onPress={spin} disabled={spinning} style={[styles.spinBtn, spinning && { opacity: 0.6 }]}>
            <Text style={styles.spinBtnText}>
              {freeLeft > 0 ? 'Spin for free' : `Spin for ${EXTRA_SPIN_COST} coins`}
            </Text>
          </Pressable>
          <Text style={styles.note}>
            Prizes: coins and vouchers. Odds are pretend, but the coins are real (in Pabili).
          </Text>
        </Wrap>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 14 },
  coinPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 },
  coinText: { color: '#fff', fontWeight: '700' },
  title: { color: '#fff', fontSize: 30, fontWeight: '900' },
  sub: { color: '#fff', opacity: 0.9, marginTop: 4 },
  pointer: { position: 'absolute', top: 0, zIndex: 2 },
  hub: { position: 'absolute', top: 20 + SIZE / 2 - 34, left: SIZE / 2 - 34, width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  hubText: { color: C.primary, fontWeight: '900', fontSize: 15 },
  result: { backgroundColor: '#fff', borderRadius: R.lg, padding: 16, alignItems: 'center', gap: 6, marginTop: 20, width: '100%', maxWidth: 360 },
  resultTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  resultSub: { fontSize: 12, color: C.muted, textAlign: 'center' },
  spinBtn: { backgroundColor: '#FACC15', borderRadius: R.pill, paddingHorizontal: 40, paddingVertical: 14, marginTop: 24 },
  spinBtnText: { color: '#7C2D12', fontWeight: '900', fontSize: 16 },
  note: { color: '#fff', opacity: 0.7, fontSize: 11, marginTop: 14, textAlign: 'center' },
});
