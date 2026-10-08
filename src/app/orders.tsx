import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState, Price, ShopTag } from '../components/bits';
import { Header, Wrap } from '../components/Page';
import { ProductImage } from '../components/ProductImage';
import { getProduct, getShop, variantLabel } from '../data/catalog';
import { useNow } from '../lib/hooks';
import { ORDER_TABS, OrderTab, STATUS_LABEL, orderStatus, orderTab } from '../lib/orders';
import { useShop } from '../store/useShop';
import { C, R, themed } from '../theme';

export default function Orders() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<OrderTab>(ORDER_TABS.some((t) => t.id === params.tab) ? (params.tab as OrderTab) : 'to_ship');
  const orders = useShop((s) => s.orders);
  const now = useNow(2000);
  const list = orders.filter((o) => orderTab(orderStatus(o, now)) === tab);
  const reviews = useShop((s) => s.reviews);
  const hasUnrated = (o: (typeof orders)[number]) =>
    o.shops.some((sh) => sh.items.some((l) => !reviews.some((r) => r.key === `${o.id}|${l.key}`)));

  return (
    <View style={{ flex: 1 }}>
      <Header title="My Purchases" cart />
      <View style={{ backgroundColor: C.card }}>
        <Wrap style={styles.tabs}>
          {ORDER_TABS.map((t) => (
            <Pressable key={t.id} style={[styles.tab, tab === t.id && styles.tabOn]} onPress={() => setTab(t.id)}>
              <Text style={[styles.tabText, tab === t.id && { color: C.primary, fontWeight: '600' }]}>{t.label}</Text>
            </Pressable>
          ))}
        </Wrap>
      </View>
      <ScrollView>
        <Wrap>
          {list.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              subtitle="Your pretend purchases will show up here."
              action={<Button title="Start Shopping" onPress={() => router.navigate('/')} style={{ width: 200 }} />}
            />
          ) : (
            list.map((o) => {
              const status = orderStatus(o, now);
              const first = o.shops[0];
              const item = first.items[0];
              const p = getProduct(item.productId);
              const more = o.shops.reduce((n, s) => n + s.items.length, 0) - 1;
              return (
                <Pressable key={o.id} style={styles.card} onPress={() => router.push(`/order/${o.id}`)}>
                  <View style={styles.cardHead}>
                    <ShopTag shop={getShop(first.shopId)} />
                    <Text style={{ flex: 1, fontWeight: '600', color: C.text }} numberOfLines={1}>
                      {getShop(first.shopId).name}
                      {o.shops.length > 1 ? ` +${o.shops.length - 1} shop${o.shops.length > 2 ? 's' : ''}` : ''}
                    </Text>
                    <Text style={[styles.status, status === 'cancelled' && { color: C.muted }]}>{STATUS_LABEL[status]}</Text>
                  </View>
                  <View style={styles.item}>
                    {p && <ProductImage emoji={p.emoji} gradient={p.gradient} size={72} radius={R.sm} />}
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text numberOfLines={2} style={{ fontSize: 13, color: C.text }}>
                        {item.label}
                      </Text>
                      {!!variantLabel(item.variant) && <Text style={styles.small}>Variation: {variantLabel(item.variant)}</Text>}
                      <Text style={styles.small}>x{item.qty}</Text>
                    </View>
                  </View>
                  {more > 0 && <Text style={[styles.small, { textAlign: 'center', paddingBottom: 8 }]}>View {more} more item{more > 1 ? 's' : ''}</Text>}
                  <View style={styles.total}>
                    <Text style={styles.small}>Order Total:</Text>
                    <Price value={o.total} size={15} />
                  </View>
                  {status === 'delivered' && (
                    <View style={styles.ctaRow}>
                      <Text style={[styles.small, { flex: 1, color: C.ship }]}>Parcel delivered. Open it to complete your order.</Text>
                      <Button title="Unbox" icon="gift" small onPress={() => router.push(`/unbox/${o.id}`)} />
                    </View>
                  )}
                  {status === 'completed' && hasUnrated(o) && (
                    <View style={styles.ctaRow}>
                      <Text style={[styles.small, { flex: 1, color: C.coin }]}>Rate your items to earn coins</Text>
                      <Button title="Rate" small onPress={() => router.push(`/rate/${o.id}`)} />
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </Wrap>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  tabs: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderColor: 'transparent' },
  tabOn: { borderColor: C.primary },
  tabText: { fontSize: 13, color: C.text },
  card: { backgroundColor: C.card, marginTop: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  status: { color: C.primary, fontSize: 12, fontWeight: '600' },
  item: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingBottom: 10 },
  small: { fontSize: 12, color: C.muted },
  total: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 12 },
}));
