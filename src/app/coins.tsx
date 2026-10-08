import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { GestureResponderEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, SectionTitle } from '../components/bits';
import { Coin } from '../components/Icon';
import { Header, Wrap } from '../components/Page';
import { ProductImage } from '../components/ProductImage';
import { defaultVariant } from '../data/catalog';
import { COIN_ITEMS, CoinItem, PESO_DEAL_COST, pesoDeals } from '../data/extras';
import { dayKey } from '../data/promos';
import { peso } from '../lib/format';
import { success, warn } from '../lib/haptics';
import { useNow } from '../lib/hooks';
import { play } from '../lib/sound';
import { useShop } from '../store/useShop';
import { toast, useUi } from '../store/useUi';
import { C, R, themed } from '../theme';
import { t } from '../i18n';

export default function CoinsShop() {
  const insets = useSafeAreaInsets();
  const now = useNow(60_000);
  const coins = useShop((s) => s.coins);
  const stats = useShop((s) => s.stats);
  const deals = pesoDeals(now);
  const day = dayKey(now);

  const redeem = (item: CoinItem) => {
    const s = useShop.getState();
    if (!s.spendCoins(item.cost)) {
      warn();
      toast(`You need ${item.cost - s.coins} more coins`, 'coin');
      return;
    }
    if (item.kind === 'voucher') s.claimVoucher(item.voucher);
    else s.setFarm({ ...s.farm, points: Math.min(200, s.farm.points + 40) });
    s.bumpStat('coinRedeems');
    success();
    play('chaching');
    toast(item.kind === 'voucher' ? `${item.title} added to My Vouchers` : 'Fertilizer added to your garden', item.kind === 'voucher' ? 'ticket' : 'flask');
  };

  const grab = (id: string, e: GestureResponderEvent) => {
    const s = useShop.getState();
    const key = `peso:${day}:${id}`;
    if (s.stats[key]) return;
    if (!s.spendCoins(PESO_DEAL_COST)) {
      warn();
      toast(`You need ${PESO_DEAL_COST - s.coins} more coins`, 'coin');
      return;
    }
    const p = deals.find((d) => d.id === id)!;
    s.addToCart({ productId: p.id, variant: defaultVariant(p), qty: 1, unitPrice: 1, unitOriginal: p.originalPrice });
    s.bumpStat(key);
    s.bumpStat('coinRedeems');
    useUi.getState().flyToCart(p.emoji, p.gradient, { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
    success();
    toast(`${p.name} added to cart for ₱1`);
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={t("Coins Shop")} cart />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <Wrap>
          <LinearGradient colors={['#F59E0B', '#FB7A3C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Coin size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>{t("Your Pabili Coins")}</Text>
              <Text style={styles.heroValue}>{coins}</Text>
            </View>
            <Button title={t("Earn more")} small variant="outline" onPress={() => router.push('/garden')} />
          </LinearGradient>

          <View style={styles.card}>
            <SectionTitle title={t("₱1 DEALS TODAY")} />
            <Text style={styles.sub}>Spend {PESO_DEAL_COST} coins, pay ₱1. One of each per day.</Text>
            <View style={styles.deals}>
              {deals.map((p) => {
                const got = !!stats[`peso:${day}:${p.id}`];
                return (
                  <View key={p.id} style={styles.deal}>
                    <ProductImage emoji={p.emoji} gradient={p.gradient} size={96} radius={R.md} />
                    <Text numberOfLines={1} style={styles.dealName}>
                      {p.name}
                    </Text>
                    <Text style={styles.dealPrice}>
                      ₱1 <Text style={styles.strike}>{peso(p.price)}</Text>
                    </Text>
                    <Button title={got ? 'Claimed' : `${PESO_DEAL_COST} coins`} small disabled={got} onPress={(e) => grab(p.id, e)} />
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <SectionTitle title={t("REDEEM")} />
            {COIN_ITEMS.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons name={item.icon} size={22} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.sub}>{item.sub}</Text>
                </View>
                <Button title={`${item.cost}`} small onPress={() => redeem(item)} disabled={coins < item.cost} />
              </View>
            ))}
          </View>
        </Wrap>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, marginBottom: 8 },
  heroLabel: { color: '#fff', fontSize: 12, opacity: 0.9 },
  heroValue: { color: '#fff', fontSize: 32, fontWeight: '900' },
  card: { backgroundColor: C.card, marginBottom: 8, paddingBottom: 12 },
  sub: { fontSize: 12, color: C.muted, paddingHorizontal: 12 },
  deals: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12 },
  deal: { width: 140, gap: 4, alignItems: 'flex-start' },
  dealName: { fontSize: 12, color: C.text },
  dealPrice: { color: C.primary, fontWeight: '900', fontSize: 16 },
  strike: { color: C.faint, fontSize: 11, fontWeight: '400', textDecorationLine: 'line-through' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '600', color: C.text, paddingHorizontal: 0 },
}));
