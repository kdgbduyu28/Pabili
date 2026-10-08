import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/bits';
import { Confetti } from '../../components/Confetti';
import { Header, Wrap, back } from '../../components/Page';
import { ProductImage } from '../../components/ProductImage';
import { getProduct, variantLabel } from '../../data/catalog';
import { getWrap } from '../../data/extras';
import { bump, success } from '../../lib/haptics';
import { useNow } from '../../lib/hooks';
import { deliveredAt, orderStatus } from '../../lib/orders';
import { play } from '../../lib/sound';
import { COINS_PER_REVIEW, useShop } from '../../store/useShop';
import { C, R, themed } from '../../theme';

const TAPS = 3;

export default function Unbox() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useShop((s) => s.orders.find((o) => o.id === id));
  const now = useNow(1000);
  // Snapshot so the reveal stays on screen after the order flips to completed.
  const [alreadyOpen] = useState(() => !!order?.receivedAt);
  const [taps, setTaps] = useState(0);
  const insets = useSafeAreaInsets();

  const wiggle = useSharedValue(0);
  const lidY = useSharedValue(0);
  const lidRot = useSharedValue(0);
  const boxScale = useSharedValue(1);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wiggle.value}deg` }, { scale: boxScale.value }],
  }));
  const lidStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, -lidY.value / 260),
    transform: [{ translateY: lidY.value }, { rotate: `${lidRot.value}deg` }],
  }));

  if (!order) {
    return (
      <View style={{ flex: 1 }}>
        <Header title="Unbox" />
        <EmptyState icon="cube-outline" title="Order not found" />
      </View>
    );
  }

  const status = orderStatus(order, now);
  const wrap = order.gift ? getWrap(order.gift.wrap) : null;
  const open = alreadyOpen || taps >= TAPS;
  const items = order.shops.flatMap((s) => s.items);

  if (!alreadyOpen && status !== 'delivered' && status !== 'completed') {
    const mins = Math.max(1, Math.ceil((deliveredAt(order) - now) / 60000));
    return (
      <View style={{ flex: 1 }}>
        <Header title="Unbox" />
        <EmptyState
          icon="bicycle-outline"
          title="Your parcel is still on the way"
          subtitle={`It should arrive in about ${mins} minute${mins > 1 ? 's' : ''}. We'll notify you.`}
        />
      </View>
    );
  }

  const tapBox = () => {
    if (open) return;
    const n = taps + 1;
    bump();
    const amp = 6 + n * 4;
    wiggle.value = withSequence(
      withTiming(-amp, { duration: 60 }),
      withTiming(amp, { duration: 90 }),
      withTiming(-amp / 2, { duration: 80 }),
      withTiming(0, { duration: 70 }),
    );
    if (n >= TAPS) {
      lidY.value = withTiming(-320, { duration: 650 });
      lidRot.value = withTiming(-35, { duration: 650 });
      boxScale.value = withSequence(withSpring(1.08), withSpring(1));
      setTimeout(() => {
        success();
        play('tada');
      }, 250);
      useShop.getState().receiveOrder(order.id);
    }
    setTaps(n);
  };

  return (
    <LinearGradient colors={['#2A1A3F', '#4C1D95', '#BE185D']} style={{ flex: 1 }}>
      <View style={{ paddingTop: insets.top }}>
        <Wrap style={styles.top}>
          <Pressable onPress={back} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </Wrap>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingBottom: insets.bottom + 24 }}>
        <Wrap style={{ maxWidth: 520, alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={styles.title}>{open ? 'Your haul is here!' : 'Your parcel has arrived'}</Text>
          <Text style={styles.sub}>
            {open ? `${items.length} item${items.length > 1 ? 's' : ''} from order ${order.id}` : `Tap the box ${TAPS - taps} more time${TAPS - taps === 1 ? '' : 's'} to open it`}
          </Text>

          {!alreadyOpen && (
            <Pressable onPress={tapBox} accessibilityLabel="Open parcel" style={{ marginTop: 32, height: 230, justifyContent: 'flex-end' }}>
              <Animated.View style={[styles.lid, lidStyle, wrap && { backgroundColor: wrap.colors[1], borderColor: wrap.colors[0] }]}>
                <View style={styles.tapeV} />
              </Animated.View>
              <Animated.View style={[styles.box, boxStyle, wrap && { backgroundColor: wrap.colors[0], borderColor: wrap.colors[1] }]}>
                <View style={styles.tapeV} />
                <View style={styles.label}>
                  <Text style={styles.labelTitle}>PABILI XPRESS</Text>
                  <Text style={styles.labelText}>{order.address.name}</Text>
                  <Text style={styles.labelText}>{order.id}</Text>
                </View>
              </Animated.View>
            </Pressable>
          )}

          {open && order.gift && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.giftNote}>
              <Text style={styles.giftTo}>Gift for {order.gift.to}</Text>
              {!!order.gift.message && <Text style={styles.giftMsg}>“{order.gift.message}”</Text>}
            </Animated.View>
          )}
          {open && (
            <View style={styles.items}>
              {items.map((it, i) => {
                const p = getProduct(it.productId);
                if (!p) return null;
                return (
                  <Animated.View
                    key={it.key}
                    entering={alreadyOpen ? FadeIn : ZoomIn.springify().damping(11).delay(450 + i * 180)}
                    style={styles.item}
                  >
                    <ProductImage emoji={p.emoji} gradient={p.gradient} size={92} radius={R.md} />
                    <Text style={styles.itemName} numberOfLines={2}>
                      {p.name}
                    </Text>
                    {!!variantLabel(it.variant) && <Text style={styles.itemVar}>{variantLabel(it.variant)}</Text>}
                    {it.qty > 1 && <Text style={styles.itemVar}>x{it.qty}</Text>}
                  </Animated.View>
                );
              })}
            </View>
          )}

          {open && (
            <Animated.View entering={FadeInDown.delay(alreadyOpen ? 0 : 900)} style={{ width: '100%', gap: 10, marginTop: 28 }}>
              <Pressable style={styles.whiteBtn} onPress={() => router.replace(`/rate/${order.id}`)}>
                <Text style={styles.whiteBtnText}>Rate & earn {items.length * COINS_PER_REVIEW} coins</Text>
              </Pressable>
              <Pressable style={styles.ghostBtn} onPress={() => router.replace(`/order/${order.id}`)}>
                <Text style={styles.ghostBtnText}>View order</Text>
              </Pressable>
            </Animated.View>
          )}
        </Wrap>
      </ScrollView>
      {open && !alreadyOpen && <Confetti seed={order.createdAt + 7} />}
    </LinearGradient>
  );
}

const BOX_W = 220;

const styles = themed(() => ({
  top: { height: 48, justifyContent: 'center', paddingHorizontal: 14 },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  sub: { color: '#fff', opacity: 0.85, marginTop: 6, textAlign: 'center' },
  box: {
    width: BOX_W,
    height: 150,
    backgroundColor: '#C68B59',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#A0693D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lid: {
    position: 'absolute',
    bottom: 140,
    left: -10,
    width: BOX_W + 20,
    height: 44,
    backgroundColor: '#D9A06B',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#A0693D',
    zIndex: 2,
    alignItems: 'center',
  },
  tapeV: { position: 'absolute', top: 0, bottom: 0, width: 36, backgroundColor: 'rgba(244,63,94,0.75)' },
  label: { backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, transform: [{ rotate: '-4deg' }], marginLeft: 70 },
  labelTitle: { fontSize: 9, fontWeight: '900', color: C.primary, letterSpacing: 1 },
  // A paper shipping label: dark ink in both themes.
  labelText: { fontSize: 9, color: '#1F2328' },
  giftNote: { backgroundColor: C.card, borderRadius: R.lg, padding: 14, alignItems: 'center', gap: 4, marginTop: 20, width: '100%' },
  giftTo: { fontWeight: '800', color: C.text },
  giftMsg: { color: C.muted, fontStyle: 'italic', textAlign: 'center' },
  items: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 28 },
  item: { width: 120, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: R.lg, padding: 10, gap: 4 },
  itemName: { color: '#fff', fontSize: 12, textAlign: 'center', fontWeight: '600' },
  itemVar: { color: '#fff', opacity: 0.75, fontSize: 11 },
  whiteBtn: { backgroundColor: '#fff', borderRadius: R.md, height: 48, alignItems: 'center', justifyContent: 'center' },
  whiteBtnText: { color: C.primary, fontWeight: '700', fontSize: 16 },
  ghostBtn: { borderColor: '#fff', borderWidth: 1.5, borderRadius: R.md, height: 48, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
}));
