import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState } from '../../components/bits';
import { Coin } from '../../components/Icon';
import { Header, Wrap } from '../../components/Page';
import { ProductImage } from '../../components/ProductImage';
import { getProduct, variantLabel } from '../../data/catalog';
import { success, tap } from '../../lib/haptics';
import { COINS_PER_REVIEW, Review, useShop } from '../../store/useShop';
import { toast } from '../../store/useUi';
import { C, R } from '../../theme';

export const REVIEW_TAGS = ['Good quality', 'Legit seller', 'Fast delivery', 'Worth it', 'As described', 'Well packed'];
const RATING_WORDS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Amazing'];

type Draft = { rating: number; tags: string[]; text: string };

export default function Rate() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const order = useShop((s) => s.orders.find((o) => o.id === id));
  const reviews = useShop((s) => s.reviews);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  if (!order) {
    return (
      <View style={{ flex: 1 }}>
        <Header title="Rate Products" />
        <EmptyState icon="star-outline" title="Order not found" />
      </View>
    );
  }

  const lines = order.shops.flatMap((s) => s.items);
  const pending = lines.filter((l) => !reviews.some((r) => r.key === `${order.id}|${l.key}`));
  const draftFor = (key: string): Draft => drafts[key] ?? { rating: 5, tags: [], text: '' };
  const update = (key: string, d: Partial<Draft>) => setDrafts((all) => ({ ...all, [key]: { ...draftFor(key), ...d } }));

  const submit = () => {
    const rs: Review[] = pending.map((l) => {
      const d = draftFor(l.key);
      return {
        key: `${order.id}|${l.key}`,
        orderId: order.id,
        productId: l.productId,
        rating: d.rating,
        tags: d.tags,
        text: d.text.trim(),
        variant: variantLabel(l.variant),
        createdAt: Date.now(),
      };
    });
    const coins = useShop.getState().addReviews(rs);
    success();
    toast(`Thanks! +${coins} Pabili Coins`, 'coin');
    router.replace(`/order/${order.id}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Rate Products" />
      <ScrollView contentContainerStyle={{ paddingBottom: 90 + insets.bottom }} keyboardShouldPersistTaps="handled">
        <Wrap style={{ maxWidth: 720 }}>
          <View style={styles.banner}>
            <Coin size={26} />
            <Text style={styles.bannerText}>
              Earn {COINS_PER_REVIEW} coins for every item you rate
            </Text>
          </View>
          {lines.map((l) => {
            const p = getProduct(l.productId);
            const done = reviews.find((r) => r.key === `${order.id}|${l.key}`);
            const d = draftFor(l.key);
            return (
              <View key={l.key} style={styles.card}>
                <View style={styles.head}>
                  {p && <ProductImage emoji={p.emoji} gradient={p.gradient} size={52} radius={R.sm} />}
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={{ fontSize: 13, color: C.text }}>
                      {l.label}
                    </Text>
                    {!!variantLabel(l.variant) && <Text style={styles.small}>Variation: {variantLabel(l.variant)}</Text>}
                  </View>
                  {done && (
                    <View style={styles.rated}>
                      <Ionicons name="checkmark-circle" size={16} color={C.success} />
                      <Text style={{ color: C.success, fontSize: 12, fontWeight: '600' }}>Rated</Text>
                    </View>
                  )}
                </View>
                {!done && (
                  <>
                    <View style={styles.stars}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Pressable
                          key={n}
                          hitSlop={4}
                          onPress={() => {
                            tap();
                            update(l.key, { rating: n });
                          }}
                        >
                          <Ionicons name={d.rating >= n ? 'star' : 'star-outline'} size={34} color={C.star} />
                        </Pressable>
                      ))}
                      <Text style={styles.word}>{RATING_WORDS[d.rating]}</Text>
                    </View>
                    <View style={styles.tags}>
                      {REVIEW_TAGS.map((t) => {
                        const on = d.tags.includes(t);
                        return (
                          <Pressable
                            key={t}
                            onPress={() => {
                              tap();
                              update(l.key, { tags: on ? d.tags.filter((x) => x !== t) : [...d.tags, t] });
                            }}
                            style={[styles.tag, on && styles.tagOn]}
                          >
                            <Text style={[styles.tagText, on && { color: C.primary }]}>{t}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <TextInput
                      value={d.text}
                      onChangeText={(text) => update(l.key, { text })}
                      placeholder="Share more about the product (optional)"
                      placeholderTextColor={C.faint}
                      multiline
                      style={styles.input}
                    />
                  </>
                )}
              </View>
            );
          })}
        </Wrap>
      </ScrollView>
      <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
        <Wrap style={{ paddingHorizontal: 12, maxWidth: 720 }}>
          {pending.length ? (
            <Button title={`Submit & earn ${pending.length * COINS_PER_REVIEW} coins`} onPress={submit} />
          ) : (
            <Button title="All rated. Back to order" variant="outline" onPress={() => router.replace(`/order/${order.id}`)} />
          )}
        </Wrap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF7E6', padding: 12, marginBottom: 8 },
  bannerText: { color: '#92400E', fontSize: 13, fontWeight: '600', flex: 1 },
  card: { backgroundColor: C.card, padding: 12, marginBottom: 8, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  small: { fontSize: 12, color: C.muted, marginTop: 2 },
  rated: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  word: { marginLeft: 8, color: C.preferred, fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { borderWidth: 1, borderColor: C.line, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 6 },
  tagOn: { borderColor: C.primary, backgroundColor: C.primarySoft },
  tagText: { fontSize: 12, color: C.text },
  input: { minHeight: 70, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, padding: 10, fontSize: 13, color: C.text, textAlignVertical: 'top' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.card, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line, paddingTop: 8 },
});
