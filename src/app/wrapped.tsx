import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coin } from '../components/Icon';
import { back } from '../components/Page';
import { ProductImage } from '../components/ProductImage';
import { peso } from '../lib/format';
import { tap } from '../lib/haptics';
import { shareText } from '../lib/share';
import { computeWrapped } from '../lib/wrapped';
import { useShop } from '../store/useShop';
import { C, R, themed } from '../theme';

const SLIDE_MS = 5000;

type Slide = { colors: [string, string]; body: ReactNode };

export default function WrappedScreen() {
  const { offset } = useLocalSearchParams<{ offset?: string }>();
  const insets = useSafeAreaInsets();
  const state = useShop();
  const w = useMemo(() => computeWrapped(state, Date.now(), Number(offset) || 0), [state, offset]);
  const [i, setI] = useState(0);

  const slides: Slide[] = [
    {
      colors: ['#7C3AED', '#F43F5E'],
      body: (
        <>
          <Text style={styles.kicker}>Pabili Wrapped</Text>
          <Text style={styles.huge}>{w.label}</Text>
          <Text style={styles.line}>Your month of pretend shopping, in a few taps.</Text>
        </>
      ),
    },
    {
      colors: ['#F43F5E', '#FB7A3C'],
      body: w.orders ? (
        <>
          <Text style={styles.kicker}>You "bought"</Text>
          <Text style={styles.huge}>{w.items}</Text>
          <Text style={styles.line}>
            things across {w.orders} order{w.orders === 1 ? '' : 's'}
            {w.topShop ? `, mostly from ${w.topShop.name}` : ''}.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.kicker}>This month so far</Text>
          <Text style={styles.big}>No orders yet</Text>
          <Text style={styles.line}>Your cart is waiting. Every pretend order counts here.</Text>
        </>
      ),
    },
    {
      colors: ['#059669', '#22D3EE'],
      body: (
        <>
          <Text style={styles.kicker}>Stayed in your wallet</Text>
          <Text style={styles.huge}>{peso(w.kept)}</Text>
          <Text style={styles.line}>Plus {peso(w.saved)} in deals you "scored". Real money spent: ₱0.</Text>
        </>
      ),
    },
    ...(w.topCategory
      ? [
          {
            colors: ['#DB2777', '#FBBF24'] as [string, string],
            body: (
              <>
                <Text style={styles.kicker}>Your top category</Text>
                <View style={styles.iconCircle}>
                  <Ionicons name={w.topCategory.category.icon} size={56} color="#fff" />
                </View>
                <Text style={styles.big}>{w.topCategory.category.name}</Text>
                <Text style={styles.line}>
                  {w.topCategory.count} item{w.topCategory.count === 1 ? '' : 's'}. You couldn't stop.
                </Text>
              </>
            ),
          },
        ]
      : []),
    ...(w.priciest
      ? [
          {
            colors: ['#1E1B4B', '#7C3AED'] as [string, string],
            body: (
              <>
                <Text style={styles.kicker}>Biggest pretend splurge</Text>
                <Animated.View entering={ZoomIn.springify().damping(12)}>
                  <ProductImage emoji={w.priciest.product.emoji} gradient={w.priciest.product.gradient} size={150} radius={R.xl} />
                </Animated.View>
                <Text style={styles.big}>{peso(w.priciest.price)}</Text>
                <Text style={styles.line}>{w.priciest.product.name}. Zero buyer's remorse.</Text>
              </>
            ),
          },
        ]
      : []),
    {
      colors: ['#0F766E', '#84CC16'],
      body:
        w.resistedCount > 0 ? (
          <>
            <Text style={styles.kicker}>You talked yourself out of</Text>
            <Text style={styles.huge}>{peso(w.resisted)}</Text>
            <Text style={styles.line}>
              {w.resistedCount} item{w.resistedCount === 1 ? '' : 's'} you changed your mind about. Iron will.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.kicker}>Coins earned</Text>
            <Coin size={80} />
            <Text style={styles.big}>{w.coins} coins</Text>
            <Text style={styles.line}>
              {w.reviews} review{w.reviews === 1 ? '' : 's'} written · {w.achievements} achievement{w.achievements === 1 ? '' : 's'} unlocked
            </Text>
          </>
        ),
    },
    {
      colors: ['#F59E0B', '#EF4444'],
      body: (
        <>
          <Text style={styles.kicker}>Your shopping persona</Text>
          <View style={styles.iconCircle}>
            <Ionicons name={w.persona.icon} size={56} color="#fff" />
          </View>
          <Text style={styles.big}>{w.persona.title}</Text>
          <Text style={styles.line}>{w.persona.desc}</Text>
        </>
      ),
    },
  ];

  const last = slides.length - 1;
  useEffect(() => {
    if (i >= last) return;
    const t = setTimeout(() => setI((x) => Math.min(last, x + 1)), SLIDE_MS);
    return () => clearTimeout(t);
  }, [i, last]);

  const slide = slides[Math.min(i, last)];

  return (
    <LinearGradient colors={slide.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <View style={[styles.bars, { paddingTop: insets.top + 8 }]}>
        {slides.map((_, k) => (
          <View key={k} style={styles.bar}>
            <View style={[styles.barFill, { width: k <= i ? '100%' : '0%' }]} />
          </View>
        ))}
      </View>
      <Pressable onPress={back} hitSlop={10} style={[styles.close, { top: insets.top + 22 }]} accessibilityLabel="Close">
        <Ionicons name="close" size={28} color="#fff" />
      </Pressable>

      <Animated.View key={i} entering={FadeIn.duration(250)} style={styles.content}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', gap: 14 }}>
          {slide.body}
        </Animated.View>
      </Animated.View>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={{ flex: 1, flexDirection: 'row', marginTop: insets.top + 60 }} pointerEvents="box-none">
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              tap();
              setI((x) => Math.max(0, x - 1));
            }}
            accessibilityLabel="Previous"
          />
          <Pressable
            style={{ flex: 2 }}
            onPress={() => {
              tap();
              setI((x) => Math.min(last, x + 1));
            }}
            accessibilityLabel="Next"
          />
        </View>
      </View>
      {i === last && (
        <View style={[styles.shareLayer, { bottom: insets.bottom + 40 }]} pointerEvents="box-none">
          <Pressable
            style={styles.share}
            onPress={() =>
              shareText(`My Pabili Wrapped for ${w.label}: ${w.items} things "bought", ${peso(w.kept)} kept in my wallet. I'm ${w.persona.title}!`)
            }
          >
            <Ionicons name="share-social" size={18} color={C.primary} />
            <Text style={styles.shareText}>Share my Wrapped</Text>
          </Pressable>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = themed(() => ({
  bars: { flexDirection: 'row', gap: 4, paddingHorizontal: 12 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  barFill: { height: 3, backgroundColor: '#fff' },
  close: { position: 'absolute', right: 14, zIndex: 3 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  kicker: { color: '#fff', opacity: 0.9, fontSize: 15, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  huge: { color: '#fff', fontSize: 64, fontWeight: '900', textAlign: 'center' },
  big: { color: '#fff', fontSize: 34, fontWeight: '900', textAlign: 'center' },
  line: { color: '#fff', fontSize: 16, textAlign: 'center', lineHeight: 22, maxWidth: 360 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  shareLayer: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  share: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: R.pill, paddingHorizontal: 20, paddingVertical: 12 },
  shareText: { color: C.primary, fontWeight: '800' },
}));
