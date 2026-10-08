import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState } from '../components/bits';
import { Header, Wrap } from '../components/Page';
import { ProductImage } from '../components/ProductImage';
import { getProduct, variantLabel } from '../data/catalog';
import { peso } from '../lib/format';
import { useMeasuredWidth } from '../lib/hooks';
import { shareText } from '../lib/share';
import { useShop } from '../store/useShop';
import { C, R, themed } from '../theme';

function ownedFor(ms: number) {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just unboxed';
  if (mins < 60) return `Owned ${mins} min`;
  const days = Math.floor(mins / 1440);
  return days ? `Owned ${days} day${days > 1 ? 's' : ''}` : `Owned ${Math.floor(mins / 60)} hr`;
}

export default function Haul() {
  const orders = useShop((s) => s.orders);
  const { width: content, onLayout } = useMeasuredWidth();
  const cols = content < 600 ? 3 : content < 900 ? 4 : 6;
  const w = Math.floor((content - 16 - 8 * (cols - 1)) / cols);

  const items = useMemo(
    () =>
      orders
        .filter((o) => o.receivedAt && !o.returnedAt && !o.cancelledAt)
        .flatMap((o) => o.shops.flatMap((s) => s.items.map((i) => ({ ...i, orderId: o.id, receivedAt: o.receivedAt! })))),
    [orders],
  );
  const pieces = items.reduce((n, i) => n + i.qty, 0);
  const value = items.reduce((n, i) => n + i.unitPrice * i.qty, 0);

  return (
    <View style={{ flex: 1 }}>
      <Header title="My Haul" cart />
      <ScrollView>
        <Wrap>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{pieces}</Text>
              <Text style={styles.statLabel}>things owned</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{peso(value)}</Text>
              <Text style={styles.statLabel}>haul value</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>₱0</Text>
              <Text style={styles.statLabel}>actually spent</Text>
            </View>
          </View>
          {items.length === 0 ? (
            <EmptyState
              icon="bag-handle-outline"
              title="Your haul is empty"
              subtitle="Unboxed orders land here. Go treat yourself (for free)."
              action={<Button title="Start Shopping" onPress={() => router.navigate('/')} style={{ width: 200 }} />}
            />
          ) : (
            <>
              <View style={styles.grid} onLayout={onLayout}>
                {items.map((i) => {
                  const p = getProduct(i.productId);
                  if (!p) return null;
                  return (
                    <Pressable key={`${i.orderId}${i.key}`} style={{ width: w }} onPress={() => router.push(`/product/${p.id}`)}>
                      <ProductImage emoji={p.emoji} gradient={p.gradient} size={w} radius={R.md} />
                      {i.qty > 1 && (
                        <View style={styles.qty}>
                          <Text style={styles.qtyText}>x{i.qty}</Text>
                        </View>
                      )}
                      <Text numberOfLines={1} style={styles.name}>
                        {p.name}
                      </Text>
                      <Text numberOfLines={1} style={styles.meta}>
                        {variantLabel(i.variant) || ownedFor(Date.now() - i.receivedAt)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ padding: 12 }}>
                <Button
                  title="Share my haul"
                  icon="share-social"
                  variant="outline"
                  onPress={() => shareText(`My Pabili haul: ${pieces} things worth ${peso(value)}, and I spent ₱0.`)}
                />
              </View>
            </>
          )}
        </Wrap>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  stats: { flexDirection: 'row', backgroundColor: C.card, paddingVertical: 16, marginBottom: 8 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '800', color: C.primary },
  statLabel: { fontSize: 11, color: C.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 8 },
  qty: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, paddingHorizontal: 6 },
  qtyText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  name: { fontSize: 12, color: C.text, marginTop: 4 },
  meta: { fontSize: 10, color: C.muted },
}));
