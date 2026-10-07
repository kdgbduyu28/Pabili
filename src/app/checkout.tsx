import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Price, ShopTag } from '../components/bits';
import { Coin, IconName } from '../components/Icon';
import { Header, Wrap } from '../components/Page';
import { ProductImage } from '../components/ProductImage';
import { variantLabel } from '../data/catalog';
import { VOUCHERS, Voucher } from '../data/promos';
import { EXPRESS_FEE, computeCheckout, deliveryDays, voucherEligible } from '../lib/checkout';
import { deliveryWindow, peso } from '../lib/format';
import { success, tap } from '../lib/haptics';
import { WRAPS } from '../data/extras';
import { play } from '../lib/sound';
import { Gift, useShop } from '../store/useShop';
import { C, R } from '../theme';

const PAYMENTS: { id: string; icon: IconName; name: string; note: string }[] = [
  { id: 'pretend', icon: 'sparkles', name: 'Pretend Pay', note: 'Recommended • Always approved' },
  { id: 'coi', icon: 'cloud-outline', name: 'Cash on Imagination', note: 'Pay the rider with good vibes' },
  { id: 'iou', icon: 'document-text-outline', name: 'IOU to Myself', note: '0% interest, forever' },
];

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const draft = useShop((s) => s.draft);
  const address = useShop((s) => s.address);
  const coins = useShop((s) => s.coins);
  const claimed = useShop((s) => s.claimed);
  const shopVouchers = useShop((s) => s.shopVouchers);
  const [express, setExpress] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [useCoins, setUseCoins] = useState(false);
  const [payment, setPayment] = useState(PAYMENTS[0].id);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [gifting, setGifting] = useState(false);
  const [gift, setGift] = useState<Gift>({ to: '', message: '', wrap: WRAPS[0].id });

  const lines = draft?.lines ?? [];
  const rawSubtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const myVouchers = VOUCHERS.filter((v) => claimed.includes(v.id));
  const slash = !!draft?.slash;
  const [voucherId, setVoucherId] = useState<string | null>(() => (slash ? null : (bestVoucher(myVouchers, rawSubtotal)?.id ?? null)));
  const voucher = myVouchers.find((v) => v.id === voucherId) ?? null;

  const sum = useMemo(
    () => computeCheckout(lines, { voucher, useCoins, coins, express, shopVouchers, freeShipping: slash }),
    [lines, voucher, useCoins, coins, express, shopVouchers, slash],
  );

  // placeOrder clears the draft; don't bounce to the cart while we navigate to the order.
  if ((!draft || !lines.length) && !placing) return <Redirect href="/cart" />;

  const place = () => {
    if (placing) return;
    tap();
    setPlacing(true);
    // A short pause sells the "processing payment" moment.
    setTimeout(() => {
      const order = useShop.getState().placeOrder(sum, {
        payment: PAYMENTS.find((p) => p.id === payment)!.name,
        messages,
        gift: gifting ? { ...gift, to: gift.to.trim() || 'Someone special', message: gift.message.trim() } : undefined,
      });
      if (gifting) useShop.getState().bumpStat('gifts');
      play('chaching');
      success();
      router.replace(`/order/${order.id}?celebrate=1`);
    }, 1400);
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Checkout" />
      <ScrollView contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}>
        <Wrap>
          {(sum.megaLive || slash) && (
            <LinearGradient colors={C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.promo}>
              <Ionicons name={slash ? 'cut' : 'sparkles'} size={18} color="#fff" />
              <Text style={styles.promoText}>
                {slash ? 'Slash It prize: this one is free, shipping included!' : 'Mega Day: free shipping on everything + 2x coins'}
              </Text>
            </LinearGradient>
          )}
          <Pressable style={styles.address} onPress={() => router.push('/address')}>
            <Ionicons name="location-outline" size={20} color={C.primary} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: C.text, fontSize: 14 }}>
                <Text style={{ fontWeight: '600' }}>{address.name}</Text> <Text style={{ color: C.muted }}>{address.phone}</Text>
              </Text>
              <Text style={styles.small}>{address.line1}</Text>
              <Text style={styles.small}>{address.city}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.faint} />
          </Pressable>
          <AirmailStripe />

          {sum.groups.map((g) => {
            const [d1, d2] = deliveryDays(g.shop, g.express);
            return (
              <View key={g.shop.id} style={styles.card}>
                <View style={styles.shopRow}>
                  <ShopTag shop={g.shop} />
                  <Text style={{ fontWeight: '600', color: C.text }}>{g.shop.name}</Text>
                </View>
                {g.lines.map((l) => (
                  <View key={l.key} style={styles.item}>
                    <ProductImage emoji={l.product.emoji} gradient={l.product.gradient} size={64} radius={R.sm} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text numberOfLines={1} style={{ fontSize: 13, color: C.text }}>
                        {l.product.title}
                      </Text>
                      {!!variantLabel(l.variant) && <Text style={styles.small}>Variation: {variantLabel(l.variant)}</Text>}
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Price value={l.unitPrice} size={14} color={C.text} style={{ fontWeight: '400' }} />
                        {l.unitOriginal > l.unitPrice && <Text style={styles.orig}>{peso(l.unitOriginal)}</Text>}
                        <View style={{ flex: 1 }} />
                        <Text style={styles.small}>x{l.qty}</Text>
                      </View>
                      {l.bundlePct > 0 && <Text style={styles.deal}>Bundle Deal: {l.bundlePct}% off for buying {l.qty}</Text>}
                    </View>
                  </View>
                ))}
                {g.shopVoucherDiscount > 0 && (
                  <View style={styles.msgRow}>
                    <Ionicons name="pricetag-outline" size={16} color={C.primary} />
                    <Text style={{ flex: 1, fontSize: 13, color: C.text }}>Shop Voucher</Text>
                    <Text style={{ fontSize: 13, color: C.primary }}>-{peso(g.shopVoucherDiscount)}</Text>
                  </View>
                )}
                <View style={styles.msgRow}>
                  <Text style={{ fontSize: 13, color: C.text }}>Message for Seller</Text>
                  <TextInput
                    placeholder="Please leave a message"
                    placeholderTextColor={C.faint}
                    value={messages[g.shop.id] ?? ''}
                    onChangeText={(t) => setMessages((m) => ({ ...m, [g.shop.id]: t }))}
                    style={styles.msgInput}
                  />
                </View>
                <Pressable
                  style={styles.shipping}
                  onPress={() => {
                    tap();
                    setExpress((e) => ({ ...e, [g.shop.id]: !e[g.shop.id] }));
                  }}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ fontSize: 13, color: C.ship, fontWeight: '600' }}>
                      Shipping Option: {g.express ? 'Express' : 'Standard Local'}
                    </Text>
                    <Text style={styles.small}>Get by {deliveryWindow(d1, d2)}</Text>
                    {g.freeShip === 'threshold' && <Text style={[styles.small, { color: C.ship }]}>Free shipping unlocked: you spent ₱499+ in this shop</Text>}
                    {!g.freeShip && !slash && (
                      <Text style={[styles.small, { color: C.preferred }]}>Add {peso(g.freeShipGap)} more from this shop for free shipping</Text>
                    )}
                    <Text style={[styles.small, { color: C.ship }]}>Tap to switch to {g.express ? 'Standard' : `Express (+${peso(EXPRESS_FEE)})`}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {g.shippingDiscount > 0 && <Text style={styles.strike}>{peso(g.shippingFee)}</Text>}
                    <Text style={{ fontSize: 13, color: C.text }}>
                      {g.shippingDiscount >= g.shippingFee ? 'FREE' : peso(g.shippingFee - g.shippingDiscount)}
                    </Text>
                  </View>
                </Pressable>
                <View style={styles.subtotal}>
                  <Text style={styles.small}>
                    Order Total ({g.lines.reduce((s, l) => s + l.qty, 0)} item{g.lines.length > 1 ? 's' : ''}):
                  </Text>
                  <Price value={g.subtotal - g.shopVoucherDiscount + g.shippingFee - (slash ? g.shippingFee : g.shippingDiscount)} size={15} />
                </View>
              </View>
            );
          })}

          <View style={styles.card}>
            <Pressable style={styles.optRow} onPress={() => setVoucherOpen((o) => !o)}>
              <Ionicons name="ticket-outline" size={20} color={C.primary} />
              <Text style={styles.optTitle}>Pabili Voucher</Text>
              <Text style={[styles.small, sum.voucher && { color: C.primary }]}>
                {sum.voucher ? sum.voucher.title : myVouchers.length ? 'Select voucher' : 'No vouchers claimed'}
              </Text>
              <Ionicons name={voucherOpen ? 'chevron-up' : 'chevron-down'} size={16} color={C.faint} />
            </Pressable>
            {voucherOpen && (
              <Animated.View entering={FadeIn} style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}>
                {myVouchers.length === 0 && (
                  <Pressable onPress={() => router.push('/vouchers')}>
                    <Text style={{ color: C.primary, fontSize: 13 }}>Claim vouchers first ›</Text>
                  </Pressable>
                )}
                {myVouchers.map((v) => {
                  const ok = !slash && voucherEligible(v, sum.subtotal - sum.shopVoucherDiscount);
                  const on = voucherId === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      disabled={!ok}
                      onPress={() => {
                        tap();
                        setVoucherId(on ? null : v.id);
                      }}
                      style={[styles.voucher, on && { borderColor: C.primary, backgroundColor: C.primarySoft }, !ok && { opacity: 0.45 }]}
                    >
                      <Ionicons name={v.kind === 'shipping' ? 'car' : 'ticket'} size={22} color={v.kind === 'shipping' ? C.ship : C.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', color: C.text }}>{v.title}</Text>
                        <Text style={styles.small}>
                          {ok
                            ? v.subtitle
                            : slash
                              ? 'Not needed, this order is free'
                              : v.megaOnly && !sum.megaLive
                                ? 'Usable on Mega Day only'
                                : `Spend ${peso(v.minSpend - (sum.subtotal - sum.shopVoucherDiscount))} more to use`}
                        </Text>
                      </View>
                      <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? C.primary : C.faint} />
                    </Pressable>
                  );
                })}
              </Animated.View>
            )}
            <View style={styles.optRow}>
              <Coin size={20} />
              <Text style={styles.optTitle}>
                Use {Math.min(coins, Math.floor((sum.total + sum.coinsUsed) * 0.5))} Pabili Coins
              </Text>
              <Text style={styles.small}>[{coins} available]</Text>
              <Switch
                value={useCoins}
                onValueChange={(v) => {
                  tap();
                  setUseCoins(v);
                }}
                disabled={coins === 0}
                trackColor={{ true: C.primary, false: '#D4D4D8' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.optRow}>
              <Ionicons name="gift-outline" size={20} color={C.primary} />
              <Text style={styles.optTitle}>Send as a gift</Text>
              <Switch
                value={gifting}
                onValueChange={(v) => {
                  tap();
                  setGifting(v);
                }}
                trackColor={{ true: C.primary, false: '#D4D4D8' }}
                thumbColor="#fff"
              />
            </View>
            {gifting && (
              <Animated.View entering={FadeIn} style={{ padding: 12, gap: 10 }}>
                <TextInput
                  value={gift.to}
                  onChangeText={(to) => setGift((g) => ({ ...g, to }))}
                  placeholder="Recipient's name"
                  placeholderTextColor={C.faint}
                  style={styles.giftInput}
                />
                <TextInput
                  value={gift.message}
                  onChangeText={(message) => setGift((g) => ({ ...g, message }))}
                  placeholder="Write a message for the gift card"
                  placeholderTextColor={C.faint}
                  multiline
                  maxLength={200}
                  style={[styles.giftInput, { minHeight: 64, textAlignVertical: 'top' }]}
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {WRAPS.map((w) => (
                    <Pressable
                      key={w.id}
                      onPress={() => {
                        tap();
                        setGift((g) => ({ ...g, wrap: w.id }));
                      }}
                      style={[styles.wrapChip, gift.wrap === w.id && { borderColor: C.primary }]}
                    >
                      <LinearGradient colors={w.colors} style={styles.wrapSwatch}>
                        <View style={[styles.wrapRibbon, { backgroundColor: w.ribbon }]} />
                      </LinearGradient>
                      <Text style={{ fontSize: 12, color: C.text }}>{w.name}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.small}>Free gift wrap. You'll get a link to send so they can unwrap it on their phone.</Text>
              </Animated.View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={[styles.optTitle, { padding: 12 }]}>Payment Method</Text>
            {PAYMENTS.map((p) => {
              const on = payment === p.id;
              return (
                <Pressable
                  key={p.id}
                  style={styles.payRow}
                  onPress={() => {
                    tap();
                    setPayment(p.id);
                  }}
                >
                  <Ionicons name={p.icon} size={22} color={C.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontSize: 14 }}>{p.name}</Text>
                    <Text style={styles.small}>{p.note}</Text>
                  </View>
                  <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={on ? C.primary : C.faint} />
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.card, { padding: 12, gap: 8 }]}>
            <Text style={styles.optTitle}>Payment Details</Text>
            <Line label="Merchandise Subtotal" value={peso(sum.subtotal + sum.bundleDiscount)} />
            {sum.bundleDiscount > 0 && <Line label="Bundle Deals" value={`-${peso(sum.bundleDiscount)}`} accent />}
            {sum.shopVoucherDiscount > 0 && <Line label="Shop Vouchers" value={`-${peso(sum.shopVoucherDiscount)}`} accent />}
            <Line label="Shipping Subtotal" value={peso(sum.shippingTotal)} />
            {sum.shippingDiscount > 0 && <Line label="Shipping Discount" value={`-${peso(sum.shippingDiscount)}`} accent />}
            {sum.voucherDiscount > 0 && <Line label="Voucher Discount" value={`-${peso(sum.voucherDiscount)}`} accent />}
            {sum.coinsUsed > 0 && <Line label="Coins Redeemed" value={`-${peso(sum.coinsUsed)}`} accent />}
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 15, color: C.text }}>Total Payment</Text>
              <Price value={sum.total} size={18} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Coin size={14} />
              <Text style={[styles.small, { color: C.coin }]}>You'll earn {sum.coinsEarned} Pabili Coins with this order</Text>
            </View>
          </View>
          <Text style={styles.disclaimer}>
            Pabili is a pretend shop. Placing an order never charges you, and nothing will be delivered.
          </Text>
        </Wrap>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
        <Wrap style={styles.barRow}>
          <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 12 }}>
            <Text style={{ fontSize: 13, color: C.text }}>
              Total Payment <Text style={{ color: C.primary, fontSize: 18, fontWeight: '700' }}>{peso(sum.total)}</Text>
            </Text>
            {sum.saved > 0 && <Text style={{ fontSize: 11, color: C.primary }}>Saved {peso(sum.saved)}</Text>}
          </View>
          <Pressable onPress={place} style={styles.placeBtn}>
            <Text style={styles.placeText}>Place Order</Text>
          </Pressable>
        </Wrap>
      </View>

      {placing && (
        <Animated.View entering={FadeIn} style={styles.processing}>
          <View style={styles.processingBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: '#fff', marginTop: 12, textAlign: 'center' }}>Processing your pretend payment…</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

function bestVoucher(vs: Voucher[], subtotal: number): Voucher | undefined {
  const value = (v: Voucher) =>
    v.kind === 'fixed' ? v.value : v.kind === 'percent' ? Math.min(v.cap ?? Infinity, (subtotal * v.value) / 100) : v.value * 0.5;
  return vs.filter((v) => voucherEligible(v, subtotal)).sort((a, b) => value(b) - value(a))[0];
}

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={styles.small}>{label}</Text>
      <Text style={[styles.small, accent && { color: C.primary }]}>{value}</Text>
    </View>
  );
}

function AirmailStripe() {
  return (
    <View style={{ flexDirection: 'row', height: 3, overflow: 'hidden', marginBottom: 8 }}>
      {Array.from({ length: 60 }, (_, i) => (
        <LinearGradient
          key={i}
          colors={i % 2 ? ['#38BDF8', '#38BDF8'] : [C.primary, C.primary]}
          style={{ width: 28, height: 3, marginRight: 6, transform: [{ skewX: '-45deg' }] }}
        />
      ))}
    </View>
  );
}


const styles = StyleSheet.create({
  address: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, padding: 14 },
  card: { backgroundColor: C.card, marginBottom: 8 },
  small: { fontSize: 12, color: C.muted },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  item: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FAFAFA' },
  orig: { fontSize: 11, color: C.faint, textDecorationLine: 'line-through', marginLeft: 6 },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  msgInput: { flex: 1, textAlign: 'right', fontSize: 13, color: C.text, paddingVertical: 4 },
  shipping: { flexDirection: 'row', backgroundColor: '#F0FBF9', borderColor: '#B8E6DF', borderWidth: 1, margin: 12, padding: 10, borderRadius: R.sm },
  strike: { fontSize: 11, color: C.faint, textDecorationLine: 'line-through' },
  subtotal: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  optTitle: { flex: 1, fontSize: 14, color: C.text, fontWeight: '500' },
  voucher: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, padding: 10 },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  promo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  promoText: { color: '#fff', fontWeight: '700', fontSize: 13, flex: 1 },
  deal: { fontSize: 11, color: C.primary },
  giftInput: { borderWidth: 1, borderColor: C.line, borderRadius: R.sm, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: C.text },
  wrapChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: C.line, borderRadius: R.pill, paddingRight: 10, padding: 3 },
  wrapSwatch: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wrapRibbon: { width: 4, height: 24 },
  disclaimer: { fontSize: 11, color: C.faint, textAlign: 'center', paddingHorizontal: 24, paddingVertical: 8 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.card, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  barRow: { flexDirection: 'row', alignItems: 'center', height: 60 },
  placeBtn: { backgroundColor: C.primary, alignSelf: 'stretch', justifyContent: 'center', paddingHorizontal: 28 },
  placeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  processing: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  processingBox: { backgroundColor: 'rgba(20,20,20,0.85)', borderRadius: 12, padding: 24, width: 220, alignItems: 'center' },
});
