import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Price, SectionTitle } from '../../components/bits';
import { Countdown } from '../../components/Countdown';
import { Coin, IconName } from '../../components/Icon';
import { Wrap, SearchHeader } from '../../components/Page';
import { ProductCard } from '../../components/ProductCard';
import { ProductGrid } from '../../components/ProductGrid';
import { ProductImage } from '../../components/ProductImage';
import { CATEGORIES, PRODUCTS, Product, TRENDING, getProduct, shuffled } from '../../data/catalog';
import { forYou } from '../../data/extras';
import { BANNERS, SLOT_MS, flashDeals, flashProgress, megaInfo, slotStart } from '../../data/promos';
import { todayKey } from '../../lib/format';
import { tap, success } from '../../lib/haptics';
import { useGrid, useNow } from '../../lib/hooks';
import { useShop } from '../../store/useShop';
import { toast } from '../../store/useUi';
import { C, R } from '../../theme';

const PAGE = 20;

let onboardingShown = false;

export default function Home() {
  const [shown, setShown] = useState(PAGE);
  const interests = useShop((s) => s.interests);
  // Built from interests only, so viewing products mid-scroll doesn't reshuffle the feed.
  const feed = useMemo(() => {
    const seed = Number(todayKey().replace(/-/g, ''));
    const { viewed, likes } = useShop.getState();
    return [...forYou(seed, interests ?? [], viewed, likes), ...shuffled(seed + 1), ...shuffled(seed + 2)];
  }, [interests]);

  // First launch: ask for interests, but only while Home is actually on screen
  // (not when a deep link lands elsewhere) and at most once per session.
  useFocusEffect(
    useCallback(() => {
      const go = () => {
        if (onboardingShown || useShop.getState().interests !== null) return;
        onboardingShown = true;
        router.push('/onboarding');
      };
      if (useShop.persist.hasHydrated()) go();
      else return useShop.persist.onFinishHydration(go);
    }, []),
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height > contentSize.height - 800 && shown < feed.length) {
      setShown((n) => Math.min(feed.length, n + PAGE));
    }
  };

  const placeholder = useMemo(() => `Search "${TRENDING[new Date().getDate() % TRENDING.length]}"`, []);

  return (
    <View style={{ flex: 1 }}>
      <SearchHeader placeholder={placeholder} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={200}>
        <Wrap>
          <Banners />
          <MegaStrip />
          <QuickActions />
          <Categories />
          <FlashStrip />
          <RecentlyViewed />
          <FollowedRow />
          <View style={styles.discoverHead}>
            <Text style={styles.discoverText}>{interests?.length ? 'FOR YOU' : 'DAILY DISCOVER'}</Text>
          </View>
          <ProductGrid products={feed.slice(0, shown)} keyPrefix="feed" />
          {shown >= feed.length && <Text style={styles.end}>You've seen it all. Your wallet thanks you.</Text>}
        </Wrap>
      </ScrollView>
    </View>
  );
}

function Banners() {
  const { content } = useGrid();
  const w = content - 16;
  const h = Math.min(Math.round(w * 0.36), 260);
  const ref = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % BANNERS.length;
        ref.current?.scrollTo({ x: next * w, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [w]);

  return (
    <View style={{ margin: 8, borderRadius: R.md, overflow: 'hidden' }}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / w))}
      >
        {BANNERS.map((b) => (
          <Pressable key={b.title} onPress={() => router.push(b.href as Href)}>
            <LinearGradient colors={b.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.banner, { width: w, height: h }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>{b.title}</Text>
                <Text style={styles.bannerSub}>{b.subtitle}</Text>
                <View style={styles.bannerCta}>
                  <Text style={styles.bannerCtaText}>Shop now</Text>
                </View>
              </View>
              <Ionicons name={b.icon} size={h * 0.5} color="rgba(255,255,255,0.92)" />
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {BANNERS.map((b, i) => (
          <View key={b.title} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function QuickActions() {
  const checkIn = useShop((s) => s.checkIn);
  const checkedIn = useShop((s) => s.checkins.includes(todayKey()));
  const items: { icon: IconName | 'coin'; label: string; onPress: () => void }[] = [
    { icon: 'flash', label: 'Flash Deals', onPress: () => router.push('/deals') },
    { icon: 'ticket', label: 'Vouchers', onPress: () => router.push('/vouchers') },
    { icon: 'car', label: 'Free Shipping', onPress: () => router.push('/search?filter=freeship') },
    { icon: 'storefront', label: 'Pabili Mall', onPress: () => router.push('/search?filter=mall') },
    {
      icon: 'coin',
      label: checkedIn ? 'Checked in' : 'Daily Coins',
      onPress: () => {
        const got = checkIn();
        if (got) {
          success();
          toast(`+${got} Pabili Coins!`, 'coin');
        } else router.navigate('/me');
      },
    },
    { icon: 'videocam', label: 'Pabili Live', onPress: () => router.navigate('/live') },
    { icon: 'sync-circle', label: 'Spin & Win', onPress: () => router.push('/spin') },
    { icon: 'phone-portrait', label: 'Shake It', onPress: () => router.push('/shake') },
    { icon: 'cut', label: 'Slash It', onPress: () => router.push('/slash') },
    { icon: 'sparkles', label: 'Mega Sale', onPress: () => router.push('/mega') },
    { icon: 'play-circle', label: 'Pabili Feed', onPress: () => router.push('/feed') },
    { icon: 'leaf', label: 'Garden', onPress: () => router.push('/garden') },
    { icon: 'storefront', label: 'Coins Shop', onPress: () => router.push('/coins') },
    { icon: 'people', label: 'Group Buy', onPress: () => router.push('/group') },
    { icon: 'stats-chart', label: 'Wrapped', onPress: () => router.push('/wrapped') },
  ];
  return (
    <View style={[styles.card, styles.quick]}>
      {items.map((it) => (
        <Pressable key={it.label} style={styles.quickItem} onPress={it.onPress}>
          <View style={styles.quickIcon}>
            {it.icon === 'coin' ? <Coin size={24} /> : <Ionicons name={it.icon} size={22} color={C.primary} />}
          </View>
          <Text style={styles.quickLabel} numberOfLines={2}>
            {it.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Categories() {
  const cols: (typeof CATEGORIES)[] = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) cols.push(CATEGORIES.slice(i, i + 2));
  return (
    <View style={styles.card}>
      <SectionTitle title="CATEGORIES" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 8 }}>
        {cols.map((col) => (
          <View key={col[0].id}>
            {col.map((c) => (
              <Pressable key={c.id} style={styles.cat} onPress={() => router.push(`/category/${c.id}`)}>
                <View style={styles.catIcon}>
                  <Ionicons name={c.icon} size={26} color={C.primary} />
                </View>
                <Text style={styles.catLabel} numberOfLines={2}>
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function MegaStrip() {
  const now = useNow();
  const mega = megaInfo(now);
  const ms = mega.live ? mega.end - now : mega.start - now;
  const days = Math.floor(ms / 86400000);
  if (!mega.live && days > 7) return null;
  return (
    <Pressable onPress={() => router.push('/mega')} style={{ marginHorizontal: 8, marginBottom: 8 }}>
      <LinearGradient colors={['#7C3AED', '#F43F5E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mega}>
        <Text style={styles.megaLabel}>{mega.label}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.megaTitle}>{mega.live ? 'MEGA SALE IS LIVE' : 'MEGA SALE'}</Text>
          <Text style={styles.megaSub}>{mega.live ? 'Free shipping + 2x coins today' : 'Vouchers drop at midnight'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <Text style={styles.megaSub}>{mega.live ? 'Ends in' : days > 0 ? `In ${days}d` : 'Starts in'}</Text>
          <Countdown ms={ms % 86400000} dark={false} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function FollowedRow() {
  const followed = useShop((s) => s.followed);
  const now = useNow(30_000);
  const products = useMemo(
    () =>
      followed
        .flatMap((id) => PRODUCTS.filter((p) => p.shopId === id).sort((a, b) => a.listedDaysAgo - b.listedDaysAgo).slice(0, 4))
        .slice(0, 12),
    [followed],
  );
  if (!products.length) return null;
  return (
    <View style={styles.card}>
      <SectionTitle title="FROM SHOPS YOU FOLLOW" right="See all" onPress={() => router.push('/following')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 8, paddingBottom: 12 }}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} width={130} now={now} />
        ))}
      </ScrollView>
    </View>
  );
}

function RecentlyViewed() {
  const viewed = useShop((s) => s.viewed);
  const now = useNow(30_000);
  const products = useMemo(() => viewed.map(getProduct).filter((p): p is Product => !!p).slice(0, 12), [viewed]);
  if (products.length < 2) return null;
  return (
    <View style={styles.card}>
      <SectionTitle title="RECENTLY VIEWED" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 8, paddingBottom: 12 }}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} width={130} now={now} />
        ))}
      </ScrollView>
    </View>
  );
}

function FlashStrip() {
  const now = useNow();
  const start = slotStart(now);
  const deals = flashDeals(start);
  return (
    <View style={styles.card}>
      <Pressable style={styles.flashHead} onPress={() => router.push('/deals')}>
        <View style={styles.flashTitleRow}>
          <Ionicons name="flash" size={18} color={C.primary} />
          <Text style={styles.flashTitle}>FLASH SALE</Text>
        </View>
        <Countdown ms={start + SLOT_MS - now} />
        <View style={{ flex: 1 }} />
        <Text style={{ color: C.muted, fontSize: 13 }}>See all ›</Text>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 12, gap: 8 }}>
        {deals.map((d) => {
          const progress = flashProgress(d, now);
          return (
            <Pressable
              key={d.product.id}
              style={{ width: 112 }}
              onPress={() => {
                tap();
                router.push(`/product/${d.product.id}`);
              }}
            >
              <ProductImage emoji={d.product.emoji} gradient={d.product.gradient} size={112} radius={R.sm} />
              <View style={styles.flashOff}>
                <Text style={styles.flashOffText}>-{Math.round((1 - d.flashPrice / d.product.originalPrice) * 100)}%</Text>
              </View>
              <Price value={d.flashPrice} size={16} style={{ textAlign: 'center', marginTop: 6 }} />
              <View style={styles.bar}>
                <LinearGradient
                  colors={C.grad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFill, { width: `${Math.round(progress * 100)}%`, borderRadius: 8 }]}
                />
                <Text style={styles.barText}>{progress > 0.85 ? 'SELLING FAST' : `${Math.round(d.total * progress)} SOLD`}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, marginBottom: 8 },
  banner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  bannerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  bannerSub: { color: '#fff', fontSize: 13, marginTop: 4, opacity: 0.95 },
  bannerCta: { marginTop: 12, backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: R.pill },
  bannerCtaText: { color: C.primary, fontWeight: '700', fontSize: 12 },
  dots: { position: 'absolute', bottom: 8, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { backgroundColor: '#fff', width: 14 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 8 },
  quickItem: { width: '20%', alignItems: 'center', gap: 6, paddingVertical: 6 },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, color: C.text, textAlign: 'center', paddingHorizontal: 2 },
  cat: { width: 84, alignItems: 'center', paddingVertical: 6, gap: 4 },
  catIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: 11, color: C.text, textAlign: 'center', minHeight: 28 },
  flashHead: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  flashTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  flashTitle: { color: C.primary, fontWeight: '900', fontSize: 16, fontStyle: 'italic' },
  flashOff: { position: 'absolute', top: 0, right: 0, backgroundColor: '#FFE5E9', paddingHorizontal: 5, paddingVertical: 2, borderBottomLeftRadius: 6 },
  flashOffText: { color: C.primary, fontWeight: '700', fontSize: 11 },
  bar: { height: 16, borderRadius: 8, backgroundColor: '#FFD0D8', marginTop: 4, justifyContent: 'center', overflow: 'hidden' },
  barText: { color: '#fff', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  mega: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 10 },
  megaLabel: { color: '#fff', fontSize: 30, fontWeight: '900', fontStyle: 'italic' },
  megaTitle: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  megaSub: { color: '#fff', fontSize: 11, opacity: 0.92 },
  discoverHead: { backgroundColor: C.card, borderBottomWidth: 3, borderColor: C.primary, paddingVertical: 12, alignItems: 'center' },
  discoverText: { color: C.primary, fontWeight: '700', letterSpacing: 0.5 },
  end: { textAlign: 'center', color: C.muted, paddingVertical: 24 },
});

