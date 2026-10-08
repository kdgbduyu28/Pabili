import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ShopTag } from '../../components/bits';
import { Browse } from '../../components/Browse';
import { ShopAvatar } from '../../components/Icon';
import { Header } from '../../components/Page';
import { PRODUCTS, getCategory, getShop } from '../../data/catalog';
import { ratingBreakdown } from '../../data/extras';
import { shopVoucher } from '../../data/promos';
import { compact, peso } from '../../lib/format';
import { bump, success } from '../../lib/haptics';
import { useShop } from '../../store/useShop';
import { toast } from '../../store/useUi';
import { C, R, themed } from '../../theme';

export default function ShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shop = getShop(id);
  const following = useShop((s) => s.followed.includes(id));
  const claimed = useShop((s) => s.shopVouchers.includes(id));
  const [cat, setCat] = useState<string | null>(null);
  const all = useMemo(() => PRODUCTS.filter((p) => p.shopId === id), [id]);
  const cats = useMemo(() => [...new Set(all.map((p) => p.categoryId))], [all]);
  const products = useMemo(() => (cat ? all.filter((p) => p.categoryId === cat) : all), [all, cat]);
  if (!shop) return <Header title="Shop" />;
  const v = shopVoucher(shop);
  const breakdown = ratingBreakdown(shop);

  return (
    <View style={{ flex: 1 }}>
      <Header
        title={shop.name}
        cart
        right={
          <Pressable onPress={() => router.push(`/chat/${shop.id}`)} hitSlop={8} accessibilityLabel="Chat with shop">
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={C.primary} />
          </Pressable>
        }
      />
      <Browse
        key={cat ?? 'all'}
        products={products}
        top={
          <View>
            <LinearGradient colors={['#3F3F46', '#18181B']} style={styles.banner}>
              <ShopAvatar shop={shop} size={60} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name}>{shop.name}</Text>
                <ShopTag shop={shop} />
                <Text style={styles.meta}>
                  {compact(shop.followers + (following ? 1 : 0))} followers · {shop.responseRate}% chat response · {shop.location}
                </Text>
              </View>
              <Pressable
                style={[styles.follow, following && { backgroundColor: 'transparent' }]}
                onPress={() => {
                  bump();
                  const on = useShop.getState().toggleFollow(shop.id);
                  if (on) toast(`Following ${shop.name}`, 'heart');
                }}
              >
                <Text style={[styles.followText, following && { color: '#fff' }]}>{following ? 'Following' : '+ Follow'}</Text>
              </Pressable>
            </LinearGradient>

            <View style={styles.panel}>
              <View style={styles.rating}>
                <Text style={styles.score}>{shop.rating.toFixed(1)}</Text>
                <Text style={styles.small}>shop rating</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                {breakdown.map((pct, i) => (
                  <View key={i} style={styles.barRow}>
                    <Text style={styles.barLabel}>{5 - i}</Text>
                    <Ionicons name="star" size={10} color={C.star} />
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.barPct}>{pct}%</Text>
                  </View>
                ))}
              </View>
            </View>

            <Pressable
              disabled={claimed}
              onPress={() => {
                success();
                useShop.getState().claimShopVoucher(shop.id);
                toast(`Claimed ${peso(v.value)} off`, 'pricetag');
              }}
              style={styles.voucher}
            >
              <Ionicons name="pricetag" size={18} color={C.primary} />
              <Text style={{ flex: 1, color: C.text, fontSize: 13 }}>
                <Text style={{ fontWeight: '800' }}>{peso(v.value)} off</Text> min. spend {peso(v.minSpend)}
              </Text>
              <Text style={{ color: claimed ? C.muted : C.primary, fontWeight: '700', fontSize: 12 }}>{claimed ? 'Claimed' : 'Claim'}</Text>
            </Pressable>

            {cats.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
                {[null, ...cats].map((c) => (
                  <Pressable key={c ?? 'all'} onPress={() => setCat(c)} style={[styles.cat, cat === c && styles.catOn]}>
                    <Text style={[styles.catText, cat === c && { color: '#fff' }]}>{c ? getCategory(c)?.name : `All (${all.length})`}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = themed(() => ({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  name: { color: '#fff', fontSize: 16, fontWeight: '700' },
  meta: { color: '#E4E4E7', fontSize: 11 },
  follow: { borderWidth: 1, borderColor: '#fff', backgroundColor: '#fff', borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 6 },
  followText: { color: C.primary, fontWeight: '700', fontSize: 12 },
  panel: { flexDirection: 'row', gap: 16, backgroundColor: C.card, padding: 14 },
  rating: { alignItems: 'center', justifyContent: 'center', width: 70 },
  score: { fontSize: 30, fontWeight: '900', color: C.text },
  small: { fontSize: 11, color: C.muted },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  barLabel: { fontSize: 10, color: C.muted, width: 8 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.surface, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: C.star },
  barPct: { fontSize: 10, color: C.muted, width: 30, textAlign: 'right' },
  voucher: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.primarySoft, paddingHorizontal: 14, paddingVertical: 10 },
  cats: { gap: 8, padding: 10, backgroundColor: C.card },
  cat: { borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.surface },
  catOn: { backgroundColor: C.primary },
  catText: { fontSize: 12, color: C.text },
}));
