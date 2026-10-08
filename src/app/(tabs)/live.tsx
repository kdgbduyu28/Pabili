import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartButton } from '../../components/CartButton';
import { Wrap } from '../../components/Page';
import { ProductImage } from '../../components/ProductImage';
import { getShop } from '../../data/catalog';
import { CLIPS } from '../../data/extras';
import { STREAMS, currentItem, livePrice, viewers } from '../../data/live';
import { compact, peso } from '../../lib/format';
import { useMeasuredWidth, useNow } from '../../lib/hooks';
import { C, R, themed } from '../../theme';
import { t } from '../../i18n';

export default function LiveList() {
  const insets = useSafeAreaInsets();
  const now = useNow(2000);
  const { width: content, onLayout } = useMeasuredWidth();
  const cols = content < 600 ? 2 : content < 900 ? 3 : 4;
  const w = Math.floor((content - 16 - 8 * (cols - 1)) / cols);
  const [mode, setMode] = useState<'live' | 'videos'>('live');

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Wrap style={styles.headerRow}>
          <View style={styles.segments}>
            {(['live', 'videos'] as const).map((m) => (
              <Pressable key={m} onPress={() => setMode(m)} style={[styles.segment, mode === m && styles.segmentOn]}>
                <Ionicons name={m === 'live' ? 'videocam' : 'play-circle'} size={16} color={mode === m ? '#fff' : C.text} />
                <Text style={[styles.segmentText, mode === m && { color: '#fff' }]}>{m === 'live' ? t("Live") : t("Videos")}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <CartButton color={C.primary} />
        </Wrap>
      </View>
      <ScrollView>
        {mode === 'videos' ? (
          <Wrap style={styles.grid} onLayout={onLayout}>
            {CLIPS.map((c, i) => (
              <Pressable key={c.id} style={[styles.card, { width: w }]} onPress={() => router.push(`/feed?start=${i}`)}>
                <LinearGradient colors={c.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.thumb, { height: w * 1.5 }]}>
                  <Text style={{ fontSize: w * 0.38 }}>{c.product.emoji}</Text>
                  <Ionicons name="play" size={22} color="#fff" style={styles.play} />
                  <View style={styles.likes}>
                    <Ionicons name="heart" size={11} color="#fff" />
                    <Text style={styles.viewersText}>{compact(c.likes)}</Text>
                  </View>
                </LinearGradient>
                <View style={{ padding: 8, gap: 2 }}>
                  <Text numberOfLines={2} style={styles.streamTitle}>
                    {c.caption}
                  </Text>
                  <Text style={styles.host}>{c.creator}</Text>
                </View>
              </Pressable>
            ))}
          </Wrap>
        ) : (
        <Wrap style={styles.grid} onLayout={onLayout}>
          {STREAMS.map((s) => {
            const { product } = currentItem(s, now);
            const shop = getShop(s.shopId);
            return (
              <Pressable key={s.id} style={[styles.card, { width: w }]} onPress={() => router.push(`/live/${s.id}`)}>
                <LinearGradient colors={s.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.thumb, { height: w * 1.35 }]}>
                  <View style={styles.badges}>
                    <View style={styles.live}>
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                    <View style={styles.viewers}>
                      <Ionicons name="eye" size={11} color="#fff" />
                      <Text style={styles.viewersText}>{compact(viewers(s, now))}</Text>
                    </View>
                  </View>
                  <View style={styles.hostCircle}>
                    <Text style={styles.hostInitial}>{s.host.split(' ').map((x) => x[0]).join('').slice(0, 2)}</Text>
                  </View>
                  <View style={styles.pinned}>
                    <ProductImage emoji={product.emoji} gradient={product.gradient} size={36} radius={4} />
                    <Text style={styles.pinnedPrice}>{peso(livePrice(product))}</Text>
                  </View>
                </LinearGradient>
                <View style={{ padding: 8, gap: 2 }}>
                  <Text numberOfLines={2} style={styles.streamTitle}>
                    {s.title}
                  </Text>
                  <Text style={styles.host} numberOfLines={1}>
                    {s.host} · {shop.name}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </Wrap>
        )}
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  header: { backgroundColor: C.card, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  headerRow: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  segments: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.pill, padding: 3 },
  segment: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: R.pill },
  segmentOn: { backgroundColor: C.primary },
  segmentText: { fontSize: 13, fontWeight: '600', color: C.text },
  play: { position: 'absolute', top: 8, right: 8 },
  likes: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 8 },
  card: { backgroundColor: C.card, borderRadius: R.md, overflow: 'hidden' },
  thumb: { justifyContent: 'center', alignItems: 'center' },
  badges: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', gap: 4 },
  live: { backgroundColor: C.primary, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  viewers: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  viewersText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  hostCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  hostInitial: { color: '#fff', fontSize: 26, fontWeight: '900' },
  pinned: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 6, padding: 3, paddingRight: 8 },
  pinnedPrice: { color: C.primary, fontWeight: '800', fontSize: 12 },
  streamTitle: { fontSize: 13, color: C.text, lineHeight: 17 },
  host: { fontSize: 11, color: C.muted },
}));
