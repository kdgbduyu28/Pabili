import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, EmptyState } from '../components/bits';
import { ShopAvatar } from '../components/Icon';
import { Header, Wrap } from '../components/Page';
import { ProductCard } from '../components/ProductCard';
import { PRODUCTS, getShop } from '../data/catalog';
import { compact } from '../lib/format';
import { useNow } from '../lib/hooks';
import { useShop } from '../store/useShop';
import { C, themed } from '../theme';
import { t } from '../i18n';

export default function Following() {
  const followed = useShop((s) => s.followed);
  const now = useNow(30_000);
  return (
    <View style={{ flex: 1 }}>
      <Header title={t("Followed Shops")} cart />
      <ScrollView>
        <Wrap>
          {followed.length === 0 ? (
            <EmptyState
              icon="storefront-outline"
              title={t("You're not following any shops")}
              subtitle={t("Follow shops to see their newest items here.")}
              action={<Button title={t("Find shops")} onPress={() => router.navigate('/')} style={{ width: 180 }} />}
            />
          ) : (
            followed.map((id) => {
              const shop = getShop(id);
              if (!shop) return null;
              const items = PRODUCTS.filter((p) => p.shopId === id)
                .sort((a, b) => a.listedDaysAgo - b.listedDaysAgo)
                .slice(0, 8);
              return (
                <View key={id} style={styles.card}>
                  <Pressable style={styles.head} onPress={() => router.push(`/shop/${id}`)}>
                    <ShopAvatar shop={shop} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{shop.name}</Text>
                      <Text style={styles.meta}>
                        {compact(shop.followers + 1)} followers · newest items
                      </Text>
                    </View>
                    <Text style={styles.visit}>{t("Visit ›")}</Text>
                  </Pressable>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 8, paddingBottom: 12 }}>
                    {items.map((p) => (
                      <ProductCard key={p.id} product={p} width={130} now={now} />
                    ))}
                  </ScrollView>
                </View>
              );
            })
          )}
        </Wrap>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  card: { backgroundColor: C.card, marginTop: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  name: { fontSize: 14, fontWeight: '700', color: C.text },
  meta: { fontSize: 11, color: C.muted },
  visit: { color: C.primary, fontWeight: '600', fontSize: 13 },
}));
