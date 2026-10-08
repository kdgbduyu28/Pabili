import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../components/bits';
import { Confetti } from '../components/Confetti';
import { Header, Wrap } from '../components/Page';
import { ProductImage } from '../components/ProductImage';
import { Product, getProduct } from '../data/catalog';
import { getWrap } from '../data/extras';
import { parseGift } from '../lib/gift';
import { bump, success } from '../lib/haptics';
import { play } from '../lib/sound';
import { C, R, themed } from '../theme';
import { t } from '../i18n';

export default function GiftPage() {
  const { d } = useLocalSearchParams<{ d?: string }>();
  const insets = useSafeAreaInsets();
  const gift = parseGift(d);
  const [open, setOpen] = useState(false);
  const shake = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${shake.value}deg` }] }));

  if (!gift) {
    return (
      <View style={{ flex: 1 }}>
        <Header title={t("Gift")} />
        <EmptyState icon="gift-outline" title={t("This gift link looks broken")} subtitle={t("Ask the sender to share it again.")} />
      </View>
    );
  }

  const wrap = getWrap(gift.w);
  const items = gift.i.map(getProduct).filter((p): p is Product => !!p);

  const unwrap = () => {
    bump();
    shake.value = withSequence(withTiming(-10, { duration: 70 }), withTiming(10, { duration: 90 }), withTiming(0, { duration: 70 }));
    setTimeout(() => {
      setOpen(true);
      success();
      play('tada');
    }, 260);
  };

  return (
    <LinearGradient colors={['#FFF1F2', '#FFE4E6', '#FED7AA']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, alignItems: 'center' }}>
        <Wrap style={{ maxWidth: 520, alignItems: 'center', paddingHorizontal: 20, gap: 8 }}>
          <Text style={styles.title}>{gift.f ? `${gift.f} sent you a gift!` : 'You got a gift!'}</Text>
          <Text style={styles.sub}>For {gift.t}</Text>

          {!open ? (
            <Pressable onPress={unwrap} accessibilityLabel={t("Unwrap gift")} style={{ marginTop: 24, alignItems: 'center', gap: 14 }}>
              <Animated.View style={style}>
                <LinearGradient colors={wrap.colors} style={styles.box}>
                  <View style={[styles.ribbonV, { backgroundColor: wrap.ribbon }]} />
                  <View style={[styles.ribbonH, { backgroundColor: wrap.ribbon }]} />
                  <Ionicons name="sparkles" size={30} color={wrap.ribbon} style={{ position: 'absolute', top: -18 }} />
                </LinearGradient>
              </Animated.View>
              <Text style={styles.tap}>{t("Tap to unwrap")}</Text>
            </Pressable>
          ) : (
            <>
              {!!gift.m && (
                <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.card}>
                  <Ionicons name="mail-open-outline" size={22} color={C.primary} />
                  <Text style={styles.msg}>“{gift.m}”</Text>
                  {!!gift.f && <Text style={styles.from}>— {gift.f}</Text>}
                </Animated.View>
              )}
              <View style={styles.items}>
                {items.map((p, i) => (
                  <Animated.View key={`${p.id}${i}`} entering={FadeInDown.delay(300 + i * 150)} style={styles.item}>
                    <ProductImage emoji={p.emoji} gradient={p.gradient} size={88} radius={R.md} />
                    <Text numberOfLines={2} style={styles.itemName}>
                      {p.name}
                    </Text>
                  </Animated.View>
                ))}
              </View>
              <Text style={styles.note}>{t("Pabili gifts are pretend: nothing ships, nobody pays, and the thought still counts.")}</Text>
              <Pressable style={styles.cta} onPress={() => router.replace('/')}>
                <Text style={styles.ctaText}>{t("Shop on Pabili")}</Text>
              </Pressable>
            </>
          )}
        </Wrap>
      </ScrollView>
      {open && <Confetti seed={gift.i.length + gift.t.length} />}
    </LinearGradient>
  );
}

const styles = themed(() => ({
  title: { fontSize: 26, fontWeight: '900', color: C.text, textAlign: 'center' },
  sub: { fontSize: 15, color: C.muted },
  box: { width: 200, height: 170, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ribbonV: { position: 'absolute', width: 28, top: 0, bottom: 0 },
  ribbonH: { position: 'absolute', height: 28, left: 0, right: 0 },
  tap: { color: C.primary, fontWeight: '700' },
  card: { backgroundColor: C.card, borderRadius: R.lg, padding: 18, alignItems: 'center', gap: 8, width: '100%', marginTop: 16 },
  msg: { fontSize: 16, color: C.text, fontStyle: 'italic', textAlign: 'center' },
  from: { color: C.muted, fontSize: 13 },
  items: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 12 },
  item: { width: 110, alignItems: 'center', gap: 6, backgroundColor: C.card, borderRadius: R.lg, padding: 10 },
  itemName: { fontSize: 12, color: C.text, textAlign: 'center' },
  note: { fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 12 },
  cta: { backgroundColor: C.primary, borderRadius: R.md, paddingHorizontal: 28, paddingVertical: 12, marginTop: 10 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
}));
