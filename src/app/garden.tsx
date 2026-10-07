import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOut, ZoomIn, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/bits';
import { Coin, IconName } from '../components/Icon';
import { Wrap, back } from '../components/Page';
import { todayKey } from '../lib/format';
import { bump, success, tap } from '../lib/haptics';
import { play } from '../lib/sound';
import { Farm, useShop } from '../store/useShop';
import { toast } from '../store/useUi';
import { C, R } from '../theme';

const WATERS_PER_DAY = 3;
const WATER_POINTS = 10;
const FERTILIZER_POINTS = 40;
const FERTILIZER_COST = 15;
const HARVEST_AT = 200;

const STAGES: { at: number; name: string; icon: IconName; size: number; color: string }[] = [
  { at: 0, name: 'Seed', icon: 'ellipse', size: 26, color: '#92400E' },
  { at: 30, name: 'Sprout', icon: 'leaf-outline', size: 56, color: '#16A34A' },
  { at: 80, name: 'Seedling', icon: 'leaf', size: 84, color: '#15803D' },
  { at: 140, name: 'Blooming', icon: 'flower', size: 108, color: '#DB2777' },
  { at: HARVEST_AT, name: 'Ready to harvest', icon: 'nutrition', size: 120, color: '#EA580C' },
];

const PLANTS = ['Mango Tree', 'Calamansi Bush', 'Sampaguita', 'Ube Vine', 'Sunflower'];

type Prize = { label: string; coins?: number; voucher?: string };

function harvestPrize(n: number): Prize {
  const prizes: Prize[] = [
    { label: '50 Pabili Coins', coins: 50 },
    { label: 'Free shipping voucher', voucher: 'FREESHIP' },
    { label: '₱20 off voucher', voucher: 'COIN20' },
    { label: '80 Pabili Coins', coins: 80 },
    { label: '15% off voucher', voucher: 'COIN15' },
  ];
  return prizes[n % prizes.length];
}

function stageOf(points: number) {
  return [...STAGES].reverse().find((s) => points >= s.at)!;
}

export default function Garden() {
  const insets = useSafeAreaInsets();
  const farm = useShop((s) => s.farm);
  const coins = useShop((s) => s.coins);
  const [drops, setDrops] = useState<number[]>([]);
  const [prize, setPrize] = useState<Prize | null>(null);
  const grow = useSharedValue(1);
  const can = useSharedValue(0);

  const usedToday = farm.water.day === todayKey() ? farm.water.used : 0;
  const left = Math.max(0, WATERS_PER_DAY - usedToday);
  const stage = stageOf(farm.points);
  const next = STAGES.find((s) => s.at > farm.points);
  const ready = farm.points >= HARVEST_AT;
  const plantName = PLANTS[farm.plant % PLANTS.length];

  const plantStyle = useAnimatedStyle(() => ({ transform: [{ scale: grow.value }] }));
  const canStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-can.value * 40}deg` }] }));

  const update = (f: Partial<Farm>) => useShop.getState().setFarm({ ...useShop.getState().farm, ...f });

  const addPoints = (n: number) => {
    const before = stageOf(farm.points);
    const points = Math.min(HARVEST_AT, farm.points + n);
    grow.value = withSequence(withSpring(1.15, { damping: 6 }), withSpring(1));
    if (stageOf(points).name !== before.name) {
      success();
      play('tada');
      toast(points >= HARVEST_AT ? 'Ready to harvest!' : `Grew into a ${stageOf(points).name.toLowerCase()}!`, 'leaf');
    }
    return points;
  };

  const water = () => {
    if (left === 0 || ready) return;
    bump();
    play('pop');
    can.value = withSequence(withTiming(1, { duration: 200 }), withTiming(1, { duration: 400 }), withTiming(0, { duration: 200 }));
    const id = Date.now();
    setDrops((d) => [...d, id]);
    setTimeout(() => setDrops((d) => d.filter((x) => x !== id)), 700);
    update({ points: addPoints(WATER_POINTS), water: { day: todayKey(), used: usedToday + 1 } });
  };

  const fertilize = () => {
    if (ready) return;
    if (!useShop.getState().spendCoins(FERTILIZER_COST)) {
      toast(`You need ${FERTILIZER_COST} coins`, 'coin');
      return;
    }
    tap();
    update({ points: addPoints(FERTILIZER_POINTS) });
  };

  const harvest = () => {
    const p = harvestPrize(farm.harvests);
    const s = useShop.getState();
    if (p.coins) s.addCoins(p.coins);
    if (p.voucher) s.claimVoucher(p.voucher);
    success();
    play('chaching');
    setPrize(p);
    update({ points: 0, plant: farm.plant + 1, harvests: farm.harvests + 1 });
  };

  return (
    <LinearGradient colors={['#BAE6FD', '#E0F2FE', '#DCFCE7']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}>
        <Wrap style={styles.top}>
          <Pressable onPress={back} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </Pressable>
          <Text style={styles.title}>Pabili Garden</Text>
          <View style={styles.coinPill}>
            <Coin size={16} />
            <Text style={{ fontWeight: '700', color: C.text }}>{coins}</Text>
          </View>
        </Wrap>

        <Wrap style={{ alignItems: 'center', paddingHorizontal: 16 }}>
          <Text style={styles.plantName}>{plantName}</Text>
          <Text style={styles.stage}>
            {stage.name} · {farm.harvests} harvest{farm.harvests === 1 ? '' : 's'} so far
          </Text>

          <View style={styles.scene}>
            <Ionicons name="sunny" size={44} color="#FACC15" style={{ position: 'absolute', top: 6, right: 16 }} />
            <Animated.View style={[styles.can, canStyle]}>
              <Ionicons name="water" size={34} color="#0EA5E9" />
            </Animated.View>
            {drops.map((d) => (
              <Animated.View key={d} entering={FadeInUp.duration(300)} exiting={FadeOut} style={styles.drop}>
                <Ionicons name="water" size={18} color="#38BDF8" />
              </Animated.View>
            ))}
            <Animated.View style={[{ alignItems: 'center', justifyContent: 'flex-end', height: 140 }, plantStyle]}>
              <Ionicons name={stage.icon} size={stage.size} color={stage.color} />
            </Animated.View>
            <View style={styles.pot}>
              <View style={styles.potRim} />
            </View>
          </View>

          <View style={styles.progressWrap}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round((farm.points / HARVEST_AT) * 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {ready ? 'Fully grown!' : `${farm.points}/${HARVEST_AT} growth${next ? ` · ${next.name} at ${next.at}` : ''}`}
            </Text>
          </View>

          {ready ? (
            <Button title="Harvest reward" icon="gift" onPress={harvest} style={{ width: '100%', maxWidth: 360, marginTop: 16 }} />
          ) : (
            <View style={styles.actions}>
              <Pressable onPress={water} disabled={left === 0} style={[styles.action, left === 0 && { opacity: 0.5 }]}>
                <Ionicons name="water" size={26} color="#0EA5E9" />
                <Text style={styles.actionTitle}>Water</Text>
                <Text style={styles.actionSub}>{left > 0 ? `${left} free left today` : 'Come back tomorrow'}</Text>
              </Pressable>
              <Pressable onPress={fertilize} style={styles.action}>
                <Ionicons name="flask" size={26} color="#A855F7" />
                <Text style={styles.actionTitle}>Fertilize</Text>
                <Text style={styles.actionSub}>+{FERTILIZER_POINTS} for {FERTILIZER_COST} coins</Text>
              </Pressable>
            </View>
          )}

          {prize && (
            <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.prize}>
              <Ionicons name="gift" size={34} color={C.primary} />
              <Text style={styles.prizeTitle}>You harvested {prize.label}!</Text>
              <Text style={styles.actionSub}>A new {PLANTS[farm.plant % PLANTS.length].toLowerCase()} seed is planted.</Text>
              {prize.voucher && <Button title="See my vouchers" small variant="outline" onPress={() => router.push('/vouchers')} />}
            </Animated.View>
          )}

          <Text style={styles.how}>
            Water up to {WATERS_PER_DAY} times a day (+{WATER_POINTS} each). Every fully grown plant drops a coin or voucher reward.
          </Text>
        </Wrap>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 52, paddingHorizontal: 14 },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: C.text },
  coinPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 },
  plantName: { fontSize: 24, fontWeight: '900', color: '#14532D', marginTop: 8 },
  stage: { color: '#166534', marginTop: 2 },
  scene: { width: '100%', maxWidth: 360, height: 280, alignItems: 'center', justifyContent: 'flex-end', marginTop: 12 },
  can: { position: 'absolute', top: 30, left: 40 },
  drop: { position: 'absolute', top: 80, left: 150 },
  pot: { width: 130, height: 70, backgroundColor: '#C2410C', borderBottomLeftRadius: 26, borderBottomRightRadius: 26, marginTop: -6 },
  potRim: { height: 16, backgroundColor: '#9A3412', marginHorizontal: -8, borderRadius: 6 },
  progressWrap: { width: '100%', maxWidth: 360, gap: 6, marginTop: 16 },
  track: { height: 12, borderRadius: 6, backgroundColor: '#fff', overflow: 'hidden' },
  fill: { height: 12, borderRadius: 6, backgroundColor: '#22C55E' },
  progressText: { fontSize: 12, color: '#166534', textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, width: '100%', maxWidth: 360, marginTop: 16 },
  action: { flex: 1, backgroundColor: '#fff', borderRadius: R.lg, padding: 14, alignItems: 'center', gap: 4 },
  actionTitle: { fontWeight: '800', color: C.text },
  actionSub: { fontSize: 11, color: C.muted, textAlign: 'center' },
  prize: { backgroundColor: '#fff', borderRadius: R.lg, padding: 16, alignItems: 'center', gap: 6, marginTop: 16, width: '100%', maxWidth: 360 },
  prizeTitle: { fontSize: 16, fontWeight: '800', color: C.text, textAlign: 'center' },
  how: { fontSize: 11, color: '#166534', textAlign: 'center', marginTop: 18, paddingHorizontal: 20 },
});
