import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Checkbox, EmptyState, Price, QtyStepper, SectionTitle, ShopTag, Tag } from '../../components/bits';
import { Wrap } from '../../components/Page';
import { ProductGrid } from '../../components/ProductGrid';
import { ProductImage } from '../../components/ProductImage';
import { getProduct, getShop, shuffled, variantLabel } from '../../data/catalog';
import { FREE_SHIP_MIN, bundleFor, shopVoucher, unitPrice } from '../../data/promos';
import { FreeShipReason, groupByShop } from '../../lib/checkout';
import { countdownParts, peso } from '../../lib/format';
import { bump, success, tap } from '../../lib/haptics';
import { useNow } from '../../lib/hooks';
import { useShop } from '../../store/useShop';
import { toast } from '../../store/useUi';
import { C, R, themed } from '../../theme';
import { t } from '../../i18n';

export default function Cart() {
  const insets = useSafeAreaInsets();
  const stored = useShop((s) => s.cart);
  const claimedShops = useShop((s) => s.shopVouchers);
  const now = useNow(1000);
  const settings = useShop((s) => s.settings);
  // Prices only ever move in your favor: a drop since adding applies automatically.
  const cart = useMemo(
    () =>
      stored.map((c) => {
        const p = getProduct(c.productId);
        const current = p ? unitPrice(p, c.variant, now).price : c.unitPrice;
        return { ...c, was: c.unitPrice, unitPrice: Math.min(c.unitPrice, current) };
      }),
    [stored, now],
  );
  const { setQty, toggleSelected, setSelected, removeFromCart, startCheckout } = useShop.getState();
  const [editing, setEditing] = useState(false);
  const groups = useMemo(() => groupByShop(cart, { shopVouchers: claimedShops, now }), [cart, claimedShops, now]);
  const picks = useMemo(() => shuffled(42).slice(0, 12), []);

  const selected = cart.filter((c) => c.selected);
  const allSelected = cart.length > 0 && selected.length === cart.length;
  // Same math as checkout (bundle deals included), before vouchers and shipping.
  const total = groupByShop(selected, { now }).reduce((s, g) => s + g.subtotal, 0);
  const saved = selected.reduce((s, c) => s + c.unitOriginal * c.qty, 0) - total;

  const unlockAt = settings.coolOff && selected.length ? Math.max(...selected.map((c) => c.addedAt)) + settings.coolOffMins * 60_000 : 0;
  const cooling = unlockAt > now;
  const [hh, mm, ss] = countdownParts(unlockAt - now);
  const coolLabel = hh === '00' ? `${mm}:${ss}` : `${hh}:${mm}:${ss}`;

  const changeMind = () => {
    const amount = useShop.getState().resist(selected.map((c) => c.key));
    success();
    toast(`You kept ${peso(amount)} for real. Iron will!`, 'shield-checkmark');
  };

  const checkout = () => {
    if (!selected.length) {
      toast('You have not selected any items for checkout', 'cart-outline');
      return;
    }
    if (cooling) {
      toast(`Cooling off. Check out in ${coolLabel}`, 'hourglass');
      return;
    }
    if (settings.coolOff) {
      const s = useShop.getState();
      s.addCoins(10);
      s.bumpStat('patience');
      toast('Patience bonus: +10 Pabili Coins', 'coin');
    }
    bump();
    startCheckout(
      selected.map(({ selected: _s, addedAt: _a, was: _w, ...line }) => line),
      true,
    );
    router.push('/checkout');
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Wrap style={styles.headerRow}>
          <Text style={styles.headerTitle}>
            {t('Shopping Cart')} <Text style={{ color: C.muted, fontWeight: '400' }}>({cart.length})</Text>
          </Text>
          {cart.length > 0 && (
            <Pressable hitSlop={10} onPress={() => setEditing((e) => !e)}>
              <Text style={{ color: C.text, fontSize: 14 }}>{editing ? t("Done") : t("Edit")}</Text>
            </Pressable>
          )}
        </Wrap>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: cart.length ? 80 : 16 }}>
        <Wrap>
          {cart.length === 0 ? (
            <View style={styles.card}>
              <EmptyState
                icon="cart-outline"
                title={t("Your shopping cart is empty")}
                subtitle={t("Go on. Fill it up. It's free.")}
                action={<Button title={t("Go Shopping Now")} onPress={() => router.navigate('/')} style={{ width: 200 }} />}
              />
            </View>
          ) : (
            <>
              {settings.coolOff && selected.length > 0 && (
                <View style={[styles.cool, !cooling && { backgroundColor: C.shipBg }]}>
                  <Ionicons name={cooling ? 'hourglass-outline' : 'checkmark-circle'} size={18} color={cooling ? C.muted : C.ship} />
                  <Text style={{ flex: 1, fontSize: 12, color: cooling ? C.text : C.ship }}>
                    {cooling
                      ? `Cool-off mode: checkout unlocks in ${coolLabel}. Still want it after? You'll get +10 coins.`
                      : 'Cool-off done! Check out now for a +10 coin patience bonus.'}
                  </Text>
                  <Pressable onPress={changeMind} hitSlop={6}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: C.primary }}>{t("Changed my mind")}</Text>
                  </Pressable>
                </View>
              )}
              <View style={styles.freeShip}>
                <Ionicons name="car-outline" size={16} color={C.ship} />
                <Text style={{ color: C.ship, fontSize: 12, flex: 1 }}>
                  Claim the FREESHIP voucher to get up to ₱80 off shipping
                </Text>
                <Pressable onPress={() => router.push('/vouchers')}>
                  <Text style={{ color: C.ship, fontSize: 12, fontWeight: '700' }}>{t("Claim ›")}</Text>
                </Pressable>
              </View>
              {groups.map((g) => {
                const keys = g.lines.map((l) => l.key);
                const shopAll = g.lines.every((l) => cart.find((c) => c.key === l.key)?.selected);
                return (
                  <View key={g.shop.id} style={styles.card}>
                    <View style={styles.shopRow}>
                      <Checkbox checked={shopAll} onPress={() => setSelected(keys, !shopAll)} />
                      <ShopTag shop={g.shop} />
                      <Pressable style={styles.shopName} onPress={() => router.push(`/shop/${g.shop.id}`)}>
                        <Text style={{ fontWeight: '600', color: C.text }} numberOfLines={1}>
                          {g.shop.name}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={C.muted} />
                      </Pressable>
                      <ShopVoucherChip shopId={g.shop.id} claimed={claimedShops.includes(g.shop.id)} />
                    </View>
                    <FreeShipBar subtotal={g.subtotal} reason={g.freeShip} gap={g.freeShipGap} />
                    {g.lines.map((l) => {
                      const item = cart.find((c) => c.key === l.key)!;
                      return (
                        <View key={l.key} style={styles.item}>
                          <Checkbox checked={item.selected} onPress={() => toggleSelected(l.key)} />
                          <Pressable onPress={() => router.push(`/product/${l.productId}`)}>
                            <ProductImage emoji={l.product.emoji} gradient={l.product.gradient} size={80} radius={R.sm} />
                          </Pressable>
                          <View style={{ flex: 1, gap: 6 }}>
                            <Text numberOfLines={2} style={styles.itemTitle}>
                              {l.product.title}
                            </Text>
                            {!!variantLabel(l.variant) && (
                              <View style={styles.variant}>
                                <Text style={styles.variantText} numberOfLines={1}>
                                  {variantLabel(l.variant)}
                                </Text>
                              </View>
                            )}
                            <View style={styles.nudges}>
                              {item.was > l.unitPrice && (
                                <Tag text={`Price dropped ${peso(item.was - l.unitPrice)}`} color="#fff" bg={C.success} />
                              )}
                              {l.product.stock < 40 && <Tag text={`Only ${l.product.stock} left`} color={C.primary} border={C.primary} />}
                              {l.bundlePct > 0 ? (
                                <Tag text={`Bundle -${l.bundlePct}%`} color="#fff" bg={C.preferred} />
                              ) : (
                                bundleFor(l.product) && <Tag text="Buy 2, save 5%" color={C.preferred} border={C.preferred} />
                              )}
                            </View>
                            <View style={styles.priceRow}>
                              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flex: 1 }}>
                                <Price value={l.unitPrice} size={15} />
                                {l.unitOriginal > l.unitPrice && <Text style={styles.orig}>{peso(l.unitOriginal)}</Text>}
                              </View>
                              {editing ? (
                                <Pressable
                                  hitSlop={8}
                                  onPress={() => {
                                    tap();
                                    removeFromCart([l.key]);
                                  }}
                                >
                                  <Ionicons name="trash-outline" size={20} color={C.primary} />
                                </Pressable>
                              ) : (
                                <QtyStepper value={l.qty} onChange={(n) => setQty(l.key, n)} max={l.product.stock} />
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </>
          )}
          <SectionTitle title={t("YOU MAY ALSO LIKE")} />
          <ProductGrid products={picks} keyPrefix="cart" />
        </Wrap>
      </ScrollView>

      {cart.length > 0 && (
        <View style={styles.bar}>
          <Wrap style={styles.barRow}>
            <Checkbox checked={allSelected} onPress={() => setSelected(cart.map((c) => c.key), !allSelected)} />
            <Text style={{ fontSize: 13, color: C.text }}>{t("All")}</Text>
            <View style={{ flex: 1 }} />
            {editing ? (
              <Button
                title={`Delete (${selected.length})`}
                variant="outline"
                disabled={!selected.length}
                onPress={() => {
                  tap();
                  removeFromCart(selected.map((c) => c.key));
                  setEditing(false);
                }}
                style={{ minWidth: 120 }}
              />
            ) : (
              <>
                <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                  <Text style={{ fontSize: 13, color: C.text }}>
                    Total <Text style={{ color: C.primary, fontSize: 17, fontWeight: '700' }}>{peso(total)}</Text>
                  </Text>
                  {saved > 0 && <Text style={{ fontSize: 11, color: C.primary }}>{t('Saved {amount}', { amount: peso(saved) })}</Text>}
                </View>
                <Pressable onPress={checkout} style={[styles.checkoutBtn, cooling && { backgroundColor: '#94A3B8' }]}>
                  <Text style={styles.checkoutText}>{cooling ? t('Wait {time}', { time: coolLabel }) : t('Check Out ({n})', { n: selected.length })}</Text>
                </Pressable>
              </>
            )}
          </Wrap>
        </View>
      )}
    </View>
  );
}

function ShopVoucherChip({ shopId, claimed }: { shopId: string; claimed: boolean }) {
  const v = shopVoucher(getShop(shopId));
  return (
    <Pressable
      disabled={claimed}
      onPress={() => {
        success();
        useShop.getState().claimShopVoucher(shopId);
        toast(`Shop voucher claimed: ${peso(v.value)} off ${peso(v.minSpend)}`, 'pricetag');
      }}
      style={[styles.svChip, claimed && { borderColor: C.line }]}
    >
      <Ionicons name="pricetag-outline" size={12} color={claimed ? C.muted : C.primary} />
      <Text style={[styles.svText, claimed && { color: C.muted }]}>
        {claimed ? `${peso(v.value)} off claimed` : `Claim ${peso(v.value)} off`}
      </Text>
    </Pressable>
  );
}

function FreeShipBar({ subtotal, reason, gap }: { subtotal: number; reason: FreeShipReason; gap: number }) {
  if (reason === 'item' || reason === 'mega') {
    return (
      <View style={styles.ship}>
        <Ionicons name="car" size={14} color={C.ship} />
        <Text style={styles.shipText}>{reason === 'mega' ? 'Mega Day: free shipping on everything' : t("Free shipping on this shop")}</Text>
      </View>
    );
  }
  const pct = Math.min(1, subtotal / FREE_SHIP_MIN);
  return (
    <View style={styles.ship}>
      <Ionicons name="car-outline" size={14} color={C.ship} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.shipText}>
          {reason === 'threshold' ? 'Free shipping unlocked!' : `Add ${peso(gap)} more for FREE shipping`}
        </Text>
        <View style={styles.shipTrack}>
          <View style={[styles.shipFill, { width: `${Math.round(pct * 100)}%` }]} />
        </View>
      </View>
      {!reason && (
        <Pressable onPress={() => router.navigate('/')} hitSlop={6}>
          <Text style={[styles.shipText, { fontWeight: '700' }]}>{t("Add more ›")}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = themed(() => ({
  header: { backgroundColor: C.card, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  headerRow: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: C.text },
  card: { backgroundColor: C.card, marginBottom: 8 },
  cool: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, paddingHorizontal: 12, paddingVertical: 10 },
  freeShip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.shipBg, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  shopName: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  itemTitle: { fontSize: 13, lineHeight: 18, color: C.text },
  variant: { backgroundColor: C.surface, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, maxWidth: '100%' },
  variantText: { fontSize: 11, color: C.muted },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  nudges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  svChip: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: C.primary, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  svText: { fontSize: 11, color: C.primary, fontWeight: '600' },
  ship: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.shipBg, paddingHorizontal: 12, paddingVertical: 8 },
  shipText: { fontSize: 12, color: C.ship },
  shipTrack: { height: 4, borderRadius: 2, backgroundColor: C.line, overflow: 'hidden' },
  shipFill: { height: 4, borderRadius: 2, backgroundColor: C.ship },
  orig: { fontSize: 11, color: C.faint, textDecorationLine: 'line-through' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.card, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 60, paddingLeft: 14 },
  checkoutBtn: { backgroundColor: C.primary, alignSelf: 'stretch', justifyContent: 'center', paddingHorizontal: 20 },
  checkoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
}));
