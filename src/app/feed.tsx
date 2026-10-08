import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { memo, useEffect, useRef, useState } from 'react';
import { GestureResponderEvent, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartButton } from '../components/CartButton';
import { back } from '../components/Page';
import { ProductImage } from '../components/ProductImage';
import { Sheet } from '../components/Sheet';
import { defaultVariant } from '../data/catalog';
import { CLIPS, CLIP_COMMENTS, Clip } from '../data/extras';
import { unitPrice } from '../data/promos';
import { compact, peso } from '../lib/format';
import { bump, tap } from '../lib/haptics';
import { shareText } from '../lib/share';
import { useShop } from '../store/useShop';
import { toast, useUi } from '../store/useUi';
import { C, R, themed } from '../theme';

const CLIP_MS = 8000;

export default function Feed() {
  const { start } = useLocalSearchParams<{ start?: string }>();
  const { height, width } = useWindowDimensions();
  const first = Math.max(0, Math.min(CLIPS.length - 1, Number(start) || 0));
  const [index, setIndex] = useState(first);
  const [comments, setComments] = useState<Clip | null>(null);
  const scroll = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollTo({ y: first * height, animated: false }), 0);
    return () => clearTimeout(t);
  }, [first, height]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / height);
    if (i !== index) {
      tap();
      setIndex(i);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView
        ref={scroll}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={onEnd}
        onScrollEndDrag={onEnd}
        decelerationRate="fast"
        snapToInterval={height}
      >
        {CLIPS.map((c, i) => (
          <ClipPage key={c.id} clip={c} active={i === index} height={height} width={width} onComments={() => setComments(c)} />
        ))}
      </ScrollView>

      <View style={[styles.top, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <Pressable onPress={back} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.topTitle}>For You</Text>
        <CartButton />
      </View>

      <Sheet open={!!comments} onClose={() => setComments(null)}>
        {comments && (
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 15, color: C.text }}>{compact(comments.comments)} comments</Text>
            {CLIP_COMMENTS.slice(0, 7).map((t, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={styles.cAvatar}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{'JMKRAPS'[i]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: C.muted }}>{['jen***', 'mark_ph', 'kiko23', 'rica**', 'ate.liza', 'pao_', 'sheng'][i]}</Text>
                  <Text style={{ fontSize: 13, color: C.text }}>{t}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Sheet>
    </View>
  );
}

type PageProps = { clip: Clip; active: boolean; height: number; width: number; onComments: () => void };

const ClipPage = memo(function ClipPage({ clip, active, height, width, onComments }: PageProps) {
  const insets = useSafeAreaInsets();
  const liked = useShop((s) => s.feedLikes.includes(clip.id));
  const t = useSharedValue(0);
  const progress = useSharedValue(0);
  const heart = useSharedValue(0);
  const p = clip.product;
  const price = unitPrice(p, {}, Date.now()).price;
  const size = Math.min(width, height) * 0.55;

  useEffect(() => {
    if (!active) {
      cancelAnimation(t);
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: CLIP_MS, easing: Easing.linear }), -1, false);
  }, [active, t, progress]);

  const hero = useAnimatedStyle(() => {
    const v = t.value;
    switch (clip.scene) {
      case 'spin':
        return { transform: [{ rotate: `${(v - 0.5) * 50}deg` }, { scale: 1 + v * 0.08 }] };
      case 'bounce':
        return { transform: [{ translateY: -v * 60 }, { scaleY: 1 - (1 - v) * 0.06 }] };
      case 'float':
        return { transform: [{ translateX: (v - 0.5) * 70 }, { translateY: Math.sin(v * Math.PI) * -24 }] };
      default:
        return { transform: [{ scale: 0.85 + v * 0.35 }] };
    }
  });
  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const pop = useAnimatedStyle(() => ({ opacity: heart.value, transform: [{ scale: 0.6 + heart.value * 0.8 }] }));

  const like = () => {
    const on = useShop.getState().toggleFeedLike(clip.id);
    bump();
    if (on) heart.value = withSequence(withTiming(1, { duration: 160 }), withTiming(0, { duration: 600 }));
  };

  const buy = (e: GestureResponderEvent) => {
    const v = defaultVariant(p);
    const u = unitPrice(p, v, Date.now());
    useShop.getState().addToCart({ productId: p.id, variant: v, qty: 1, unitPrice: u.price, unitOriginal: u.original });
    bump();
    useUi.getState().flyToCart(p.emoji, p.gradient, { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
    toast('Added to cart');
  };

  return (
    <Pressable onLongPress={like} delayLongPress={250} style={{ height, width }}>
      <LinearGradient colors={clip.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Animated.View style={hero}>
          <ProductImage emoji={p.emoji} gradient={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.05)']} size={size} radius={size / 2} />
        </Animated.View>
        <Animated.View style={[styles.bigHeart, pop]} pointerEvents="none">
          <Ionicons name="heart" size={120} color="#fff" />
        </Animated.View>
      </View>

      <View style={[styles.rail, { bottom: insets.bottom + 150 }]}>
        <View style={styles.creator}>
          <Text style={{ color: '#fff', fontWeight: '900' }}>{clip.creator[1].toUpperCase()}</Text>
        </View>
        <RailButton icon={liked ? 'heart' : 'heart-outline'} color={liked ? C.primary : '#fff'} label={compact(clip.likes + (liked ? 1 : 0))} onPress={like} />
        <RailButton icon="chatbubble-ellipses" label={compact(clip.comments)} onPress={onComments} />
        <RailButton icon="arrow-redo" label="Share" onPress={() => shareText(`Look what I found on Pabili: ${p.name} for ${peso(price)}`)} />
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.handle}>{clip.creator}</Text>
        <Text style={styles.caption} numberOfLines={2}>
          {clip.caption}
        </Text>
        <Pressable style={styles.chip} onPress={() => router.push(`/product/${p.id}`)}>
          <ProductImage emoji={p.emoji} gradient={p.gradient} size={44} radius={R.sm} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 12, color: C.text }}>
              {p.title}
            </Text>
            <Text style={{ color: C.primary, fontWeight: '800' }}>{peso(price)}</Text>
          </View>
          <Pressable onPress={buy} style={styles.buy}>
            <Ionicons name="cart" size={16} color="#fff" />
            <Text style={styles.buyText}>Buy</Text>
          </Pressable>
        </Pressable>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, bar]} />
        </View>
      </View>
    </Pressable>
  );
});

function RailButton({ icon, label, onPress, color = '#fff' }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', gap: 2 }} hitSlop={6}>
      <Ionicons name={icon} size={32} color={color} />
      <Text style={styles.railText}>{label}</Text>
    </Pressable>
  );
}

const styles = themed(() => ({
  top: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  topTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  bigHeart: { position: 'absolute' },
  rail: { position: 'absolute', right: 12, alignItems: 'center', gap: 18 },
  creator: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  railText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, gap: 8, paddingRight: 80 },
  handle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  caption: { color: '#fff', fontSize: 13, lineHeight: 18 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderRadius: R.md, padding: 6, maxWidth: 380 },
  buy: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 8 },
  buyText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  track: { height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1, marginTop: 6, marginRight: -66 },
  fill: { height: 2, backgroundColor: '#fff', borderRadius: 1 },
  cAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.faint, alignItems: 'center', justifyContent: 'center' },
}));
