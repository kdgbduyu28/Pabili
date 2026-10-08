import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coin } from '../components/Icon';
import { Wrap, back } from '../components/Page';
import { todayKey } from '../lib/format';
import { bump, success } from '../lib/haptics';
import { play } from '../lib/sound';
import { useShop } from '../store/useShop';
import { C, R, themed } from '../theme';
import { t } from '../i18n';

export const SHAKES_PER_DAY = 3;
const THRESHOLD = 1.8; // in g; a deliberate shake, not a walk

type Reward = { coins?: number; voucher?: string; label: string };

function roll(): Reward {
  const r = Math.random();
  if (r < 0.18) return { voucher: 'SHAKE30', label: '₱30 off voucher' };
  const coins = [1, 2, 3, 5, 5, 8, 10, 15][Math.floor(Math.random() * 8)];
  return { coins, label: `${coins} coins` };
}

export default function Shake() {
  const insets = useSafeAreaInsets();
  const shakes = useShop((s) => s.shakes);
  const used = shakes.day === todayKey() ? shakes.used : 0;
  const left = Math.max(0, SHAKES_PER_DAY - used);
  const [reward, setReward] = useState<Reward | null>(null);
  const [sensor, setSensor] = useState(false);
  const busy = useRef(false);
  const wobble = useSharedValue(0);
  const box = useAnimatedStyle(() => ({ transform: [{ rotate: `${wobble.value}deg` }] }));

  const shake = useCallback(() => {
    if (busy.current) return;
    if (!useShop.getState().countDaily('shakes', SHAKES_PER_DAY)) return;
    busy.current = true;
    bump();
    setReward(null);
    wobble.value = withSequence(withRepeat(withSequence(withTiming(-14, { duration: 60 }), withTiming(14, { duration: 60 })), 6), withTiming(0, { duration: 80 }));
    setTimeout(() => {
      const r = roll();
      const s = useShop.getState();
      if (r.coins) s.addCoins(r.coins);
      if (r.voucher) s.claimVoucher(r.voucher);
      s.bumpStat('shakes');
      success();
      play(r.voucher ? 'tada' : 'coin');
      setReward(r);
      busy.current = false;
    }, 900);
  }, [wobble]);

  // Real shaking on phones; the button covers web and devices without a sensor.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: { remove: () => void } | undefined;
    Accelerometer.isAvailableAsync().then((ok) => {
      if (!ok) return;
      setSensor(true);
      Accelerometer.setUpdateInterval(100);
      sub = Accelerometer.addListener(({ x, y, z }) => {
        if (Math.sqrt(x * x + y * y + z * z) > THRESHOLD) shake();
      });
    });
    return () => sub?.remove();
  }, [shake]);

  return (
    <LinearGradient colors={['#0F766E', '#14B8A6', '#FB7A3C']} style={{ flex: 1, paddingTop: insets.top }}>
      <Wrap style={styles.top}>
        <Pressable onPress={back} hitSlop={10} accessibilityLabel={t("Back")}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
      </Wrap>
      <Wrap style={{ flex: 1, alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={styles.title}>{t("Shake It!")}</Text>
        <Text style={styles.sub}>
          {left > 0 ? `${sensor ? 'Shake your phone' : 'Tap the gift'} to win coins or vouchers · ${left} left today` : 'No shakes left today. Come back tomorrow!'}
        </Text>

        <Pressable onPress={shake} disabled={left === 0} style={{ marginTop: 40 }} accessibilityLabel={t("Shake")}>
          <Animated.View style={[styles.gift, box, left === 0 && { opacity: 0.5 }]}>
            <Ionicons name="gift" size={120} color="#fff" />
          </Animated.View>
        </Pressable>

        {reward && (
          <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.result}>
            {reward.coins ? <Coin size={36} /> : <Ionicons name="ticket" size={36} color={C.primary} />}
            <Text style={styles.resultTitle}>You got {reward.label}!</Text>
            <Text style={styles.resultSub}>{reward.voucher ? 'Find it in My Vouchers. It applies at checkout.' : 'Added to your Pabili Coins.'}</Text>
          </Animated.View>
        )}

        <View style={styles.dots}>
          {Array.from({ length: SHAKES_PER_DAY }, (_, i) => (
            <View key={i} style={[styles.dot, i < used && styles.dotUsed]} />
          ))}
        </View>
      </Wrap>
    </LinearGradient>
  );
}

const styles = themed(() => ({
  top: { height: 48, justifyContent: 'center', paddingHorizontal: 14 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 12 },
  sub: { color: '#fff', opacity: 0.92, marginTop: 6, textAlign: 'center' },
  gift: { width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  result: { backgroundColor: C.card, borderRadius: R.lg, padding: 16, alignItems: 'center', gap: 6, marginTop: 32, width: '100%', maxWidth: 360 },
  resultTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  resultSub: { fontSize: 12, color: C.muted, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 8, marginTop: 28 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
  dotUsed: { backgroundColor: 'rgba(255,255,255,0.35)' },
}));
