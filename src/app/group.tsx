import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Price } from '../components/bits';
import { Header, Wrap } from '../components/Page';
import { ProductImage } from '../components/ProductImage';
import { defaultVariant, getProduct, variantLabel } from '../data/catalog';
import { GROUP_FRIENDS, GroupDeal, groupDeals } from '../data/extras';
import { compact, peso } from '../lib/format';
import { bump, success } from '../lib/haptics';
import { useNow } from '../lib/hooks';
import { shareText } from '../lib/share';
import { useShop } from '../store/useShop';
import { toast } from '../store/useUi';
import { C, R, themed } from '../theme';

const WINDOW_MS = 24 * 3600 * 1000;

export default function Group() {
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const group = useShop((s) => s.group);
  const deals = groupDeals(now);
  const active = group && !group.claimedAt && now - group.startedAt < WINDOW_MS ? group : null;
  const product = active ? getProduct(active.productId) : undefined;
  const joined = active ? active.members.filter((m) => m.at <= now) : [];
  const full = !!active && joined.length >= active.size;

  const start = (d: GroupDeal) => {
    // Strangers trickle in over a minute or two; inviting friends speeds it up.
    const t = Date.now();
    const strangers = ['shopper_ph', 'suki.mae', 'kuya.bong', 'ate.gina'].slice(0, d.size - 2).map((name, i) => ({ name, at: t + 25_000 + i * 35_000 }));
    useShop.getState().startGroup({ productId: d.product.id, price: d.price, size: d.size, startedAt: t, members: [{ name: 'You', at: t }, ...strangers] });
    success();
    toast(`Group started! ${d.size - 1} more to go`, 'people');
  };

  const invite = async () => {
    if (!active || !product) return;
    await shareText(`Join my Pabili group buy: ${product.name} for only ${peso(active.price)}!`);
    const used = new Set(active.members.map((m) => m.name));
    const friend = GROUP_FRIENDS.find((f) => !used.has(f));
    if (friend) useShop.getState().addGroupMembers([{ name: friend, at: Date.now() + 4000 }]);
    bump();
  };

  const checkout = () => {
    if (!active || !product) return;
    const v = defaultVariant(product);
    useShop.getState().bumpStat('groupBuys');
    useShop
      .getState()
      .startCheckout([{ key: `${product.id}|${variantLabel(v)}`, productId: product.id, variant: v, qty: 1, unitPrice: active.price, unitOriginal: product.originalPrice }], false, { group: true });
    router.push('/checkout');
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Group Buy" cart />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <Wrap style={{ maxWidth: 720 }}>
          {active && product ? (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <ProductImage emoji={product.emoji} gradient={product.gradient} size={100} radius={R.md} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text numberOfLines={2} style={{ fontSize: 14, color: C.text }}>
                    {product.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Price value={active.price} size={22} />
                    <Text style={styles.strike}>{peso(product.price)}</Text>
                  </View>
                  <Text style={styles.small}>Group price for {active.size} people</Text>
                </View>
              </View>
              <View style={styles.seats}>
                {Array.from({ length: active.size }, (_, i) => {
                  const m = joined[i];
                  return (
                    <View key={i} style={{ alignItems: 'center', gap: 4, width: 64 }}>
                      <View style={[styles.seat, m && styles.seatOn, m?.name === 'You' && { backgroundColor: C.primary }]}>
                        {m ? <Text style={styles.seatText}>{m.name === 'You' ? 'ME' : m.name.replace(/[^A-Za-z ]/g, '').split(' ').pop()![0]?.toUpperCase()}</Text> : <Ionicons name="add" size={20} color={C.faint} />}
                      </View>
                      <Text numberOfLines={1} style={styles.seatName}>
                        {m ? m.name : 'Waiting'}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <Text style={[styles.small, { textAlign: 'center' }]}>
                {full ? 'Group complete! Check out at the group price.' : `${active.size - joined.length} more needed. Strangers join on their own, or invite friends to speed it up.`}
              </Text>
              {full ? <Button title={`Check out for ${peso(active.price)}`} icon="cart" onPress={checkout} /> : <Button title="Invite friends" icon="share-social" onPress={invite} />}
            </View>
          ) : (
            <View style={[styles.card, { alignItems: 'center' }]}>
              <Ionicons name="people" size={34} color={C.primary} />
              <Text style={styles.cardTitle}>Shop together, pay less</Text>
              <Text style={[styles.small, { textAlign: 'center' }]}>
                Start a group and fill every seat within 24 hours to unlock the group price. {group?.claimedAt ? 'Your last group order is on its way!' : ''}
              </Text>
            </View>
          )}

          {deals.map((d) => (
            <View key={d.product.id} style={[styles.card, styles.dealRow]}>
              <ProductImage emoji={d.product.emoji} gradient={d.product.gradient} size={76} radius={R.sm} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text numberOfLines={2} style={{ fontSize: 13, color: C.text }}>
                  {d.product.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Price value={d.price} size={17} />
                  <Text style={styles.strike}>{peso(d.product.price)}</Text>
                </View>
                <Text style={styles.small}>
                  {d.size}-person group · {compact(d.joined)} joined today
                </Text>
              </View>
              <Button title="Start" small icon="people" disabled={!!active} onPress={() => start(d)} />
            </View>
          ))}
        </Wrap>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  card: { backgroundColor: C.card, padding: 14, marginTop: 8, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  small: { fontSize: 12, color: C.muted },
  strike: { fontSize: 12, color: C.faint, textDecorationLine: 'line-through' },
  seats: { flexDirection: 'row', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  seat: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: C.faint, alignItems: 'center', justifyContent: 'center' },
  seatOn: { borderStyle: 'solid', borderColor: '#fff', backgroundColor: C.ship },
  seatText: { color: '#fff', fontWeight: '800' },
  seatName: { fontSize: 10, color: C.muted },
  dealRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
}));
