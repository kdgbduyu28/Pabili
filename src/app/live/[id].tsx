import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/bits';
import { CartButton } from '../../components/CartButton';
import { Header, Wrap, back } from '../../components/Page';
import { ProductImage } from '../../components/ProductImage';
import { defaultVariant, getShop } from '../../data/catalog';
import { LiveComment, currentItem, getStream, livePrice, liveStock, randomComment, viewers } from '../../data/live';
import { compact, peso } from '../../lib/format';
import { bump, success, tap } from '../../lib/haptics';
import { useNow } from '../../lib/hooks';
import { useShop } from '../../store/useShop';
import { toast, useUi } from '../../store/useUi';
import { C, R } from '../../theme';

const MAX_COMMENTS = 7;
const VOUCHER_EVERY = 40_000;

export default function LiveRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stream = getStream(id);
  if (!stream) {
    return (
      <View style={{ flex: 1 }}>
        <Header title="Live" />
        <EmptyState icon="videocam-off-outline" title="This live has ended" />
      </View>
    );
  }
  return <Room key={stream.id} stream={stream} />;
}

function Room({ stream }: { stream: NonNullable<ReturnType<typeof getStream>> }) {
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const shop = getShop(stream.shopId);
  const { product, index, endsIn } = currentItem(stream, now);
  const price = livePrice(product);
  const stock = liveStock(stream, now);
  const hasVoucher = useShop((s) => s.claimed.includes('LIVE30') || s.usedVouchers.includes('LIVE30'));
  const voucherUp = !hasVoucher && Math.floor(now / VOUCHER_EVERY) % 2 === 0;
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [text, setText] = useState('');
  const [following, setFollowing] = useState(false);
  const [hearts, setHearts] = useState<number[]>([]);
  const seed = useRef(Date.now());

  const push = (c: LiveComment) => setComments((cs) => [...cs.slice(-(MAX_COMMENTS - 1)), c]);

  useEffect(() => {
    const t = setInterval(() => {
      push(randomComment(seed.current++));
      if (Math.random() < 0.35) setHearts((h) => [...h, seed.current++]);
    }, 1300);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    push({ id: `host${index}${Date.now()}`, name: stream.host, text: `Next item: ${product.name} for only ${peso(price)}! Type "Mine" to grab it!` });
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const heart = () => {
    tap();
    setHearts((h) => [...h, seed.current++]);
  };

  const mine = (e: GestureResponderEvent) => {
    const v = defaultVariant(product);
    useShop.getState().addToCart({ productId: product.id, variant: v, qty: 1, unitPrice: price, unitOriginal: product.originalPrice });
    bump();
    useUi.getState().flyToCart(product.emoji, product.gradient, { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
    push({ id: `me${Date.now()}`, name: 'You', text: 'Mine!', me: true });
    useShop.getState().bumpStat('liveMine');
    toast(`Added at the live price of ${peso(price)}`);
  };

  const send = () => {
    const t = text.trim();
    if (!t) return;
    push({ id: `me${Date.now()}`, name: 'You', text: t, me: true });
    setText('');
    setTimeout(() => push({ id: `hr${Date.now()}`, name: stream.host, text: `Thank you for joining! Salamat sa support!` }), 1800);
  };

  return (
    <LinearGradient colors={['#111827', stream.colors[0], stream.colors[1]]} style={{ flex: 1 }}>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', paddingBottom: 160 }]}>
        <Speaker initials={stream.host.split(' ').map((x) => x[0]).join('').slice(0, 2)} />
        <Text style={styles.speaking}>{stream.host} is talking about {product.name}</Text>
      </View>

      <View style={{ paddingTop: insets.top + 6 }}>
        <Wrap style={styles.topRow}>
          <View style={styles.hostPill}>
            <View style={styles.hostDot}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>{stream.host[0]}</Text>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.hostName} numberOfLines={1}>
                {stream.host}
              </Text>
              <Text style={styles.hostShop} numberOfLines={1}>
                {shop.name}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                bump();
                setFollowing((f) => !f);
              }}
              style={[styles.follow, following && { backgroundColor: 'rgba(255,255,255,0.25)' }]}
            >
              <Text style={styles.followText}>{following ? 'Following' : 'Follow'}</Text>
            </Pressable>
          </View>
          <View style={{ flexGrow: 1 }} />
          <View style={styles.viewers}>
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Ionicons name="eye" size={12} color="#fff" />
            <Text style={styles.viewersText}>{compact(viewers(stream, now))}</Text>
          </View>
          <View style={styles.round}>
            <CartButton size={20} />
          </View>
          <Pressable onPress={back} hitSlop={8} style={styles.round} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </Wrap>
        <Wrap style={{ paddingHorizontal: 12, marginTop: 6 }}>
          <Text style={styles.streamTitle}>{stream.title}</Text>
        </Wrap>
      </View>

      <View style={{ flex: 1 }} />

      <Wrap style={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 10, gap: 10 }}>
        {voucherUp && (
          <Animated.View entering={FadeInDown} exiting={FadeOut} style={styles.voucher}>
            <Ionicons name="ticket" size={22} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: C.text }}>₱30 Live Voucher</Text>
              <Text style={{ fontSize: 11, color: C.muted }}>Only for viewers right now · Min. spend ₱199</Text>
            </View>
            <Pressable
              onPress={() => {
                success();
                useShop.getState().claimVoucher('LIVE30');
                toast('Live voucher claimed!', 'ticket');
              }}
              style={styles.claim}
            >
              <Text style={styles.claimText}>Claim</Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={styles.comments}>
          {comments.map((c) => (
            <Animated.View key={c.id} entering={FadeInDown.duration(220)} style={[styles.comment, c.me && { backgroundColor: 'rgba(244,63,94,0.55)' }]}>
              <Text style={styles.commentText}>
                <Text style={[styles.commentName, c.name === stream.host && { color: '#FDE68A' }]}>{c.name} </Text>
                {c.text}
              </Text>
            </Animated.View>
          ))}
        </View>

        <Pressable style={styles.pinned} onPress={() => router.push(`/product/${product.id}`)}>
          <ProductImage emoji={product.emoji} gradient={product.gradient} size={64} radius={R.sm} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text numberOfLines={1} style={{ fontSize: 13, color: C.text }}>
              {product.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ color: C.primary, fontWeight: '800', fontSize: 17 }}>{peso(price)}</Text>
              <Text style={styles.strike}>{peso(product.originalPrice)}</Text>
            </View>
            <Text style={{ fontSize: 11, color: C.primary }}>
              Only {stock} left at this price · next item in {Math.ceil(endsIn / 1000)}s
            </Text>
          </View>
          <Pressable onPress={mine} style={styles.mine}>
            <Text style={styles.mineText}>Mine!</Text>
          </Pressable>
        </Pressable>

        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            placeholder="Say something…"
            placeholderTextColor="rgba(255,255,255,0.7)"
            returnKeyType="send"
            style={styles.input}
          />
          <Pressable onPress={heart} style={styles.heartBtn} accessibilityLabel="Send a heart">
            <Ionicons name="heart" size={22} color="#fff" />
          </Pressable>
        </View>
      </Wrap>

      <View pointerEvents="none" style={styles.heartLane}>
        {hearts.map((h) => (
          <Heart key={h} seed={h} onDone={() => setHearts((hs) => hs.filter((x) => x !== h))} />
        ))}
      </View>
    </LinearGradient>
  );
}

function Speaker({ initials }: { initials: string }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false);
  }, [pulse]);
  const ring = useAnimatedStyle(() => ({ opacity: 1 - pulse.value, transform: [{ scale: 1 + pulse.value * 0.6 }] }));
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[styles.ring, ring]} />
      <View style={styles.speaker}>
        <Text style={styles.speakerText}>{initials}</Text>
      </View>
    </View>
  );
}

const HEART_COLORS = ['#F43F5E', '#FB7A3C', '#FACC15', '#EC4899', '#A855F7'];

function Heart({ seed, onDone }: { seed: number; onDone: () => void }) {
  const t = useSharedValue(0);
  const drift = ((seed * 9301) % 60) - 30;
  const color = HEART_COLORS[seed % HEART_COLORS.length];
  useEffect(() => {
    t.value = withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) });
    const timer = setTimeout(onDone, 1850);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateY: -260 * t.value }, { translateX: drift * Math.sin(t.value * 6) }, { scale: 0.6 + t.value * 0.6 }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', bottom: 0, right: 0 }, style]}>
      <Ionicons name="heart" size={28} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  speaking: { color: '#fff', opacity: 0.8, marginTop: 18, fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },
  ring: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 3, borderColor: '#fff' },
  speaker: { width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  speakerText: { color: '#fff', fontSize: 52, fontWeight: '900' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10 },
  hostPill: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: R.pill, padding: 4, paddingRight: 4 },
  hostDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  hostName: { color: '#fff', fontWeight: '700', fontSize: 12 },
  hostShop: { color: '#fff', opacity: 0.75, fontSize: 10 },
  follow: { backgroundColor: C.primary, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 5 },
  followText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  viewers: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: R.pill, paddingRight: 8 },
  liveBadge: { backgroundColor: C.primary, borderRadius: R.pill, paddingHorizontal: 6, paddingVertical: 2 },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  viewersText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  round: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  streamTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  voucher: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF5F7', borderRadius: R.md, padding: 10, alignSelf: 'flex-start', maxWidth: 380, width: '100%' },
  claim: { backgroundColor: C.primary, borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 6 },
  claimText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  comments: { gap: 4, maxWidth: 320 },
  comment: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  commentName: { color: '#FECDD3', fontWeight: '700' },
  commentText: { color: '#fff', fontSize: 12 },
  pinned: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: R.md, padding: 8 },
  strike: { fontSize: 11, color: C.faint, textDecorationLine: 'line-through' },
  mine: { backgroundColor: C.primary, borderRadius: R.md, paddingHorizontal: 16, paddingVertical: 12 },
  mineText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 16, color: '#fff', fontSize: 14 },
  heartBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  heartLane: { position: 'absolute', right: 24, bottom: 70, width: 60, height: 300 },
});
