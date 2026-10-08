import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Price, ShopTag } from '../../components/bits';
import { Confetti } from '../../components/Confetti';
import { Coin, IconName } from '../../components/Icon';
import { Header, Wrap } from '../../components/Page';
import { ParcelMap } from '../../components/ParcelMap';
import { getWrap } from '../../data/extras';
import { giftLink } from '../../lib/gift';
import { shareText } from '../../lib/share';
import { ProductImage } from '../../components/ProductImage';
import { Sheet } from '../../components/Sheet';
import { getProduct, getShop, variantLabel } from '../../data/catalog';
import { getVoucher } from '../../data/promos';
import { dateTime, peso } from '../../lib/format';
import { bump, success } from '../../lib/haptics';
import { useNow } from '../../lib/hooks';
import { canReturn, isLate, orderStatus, routeProgress, timeline } from '../../lib/orders';
import { COINS_PER_REVIEW, Order, keptInWallet, useShop } from '../../store/useShop';
import { toast } from '../../store/useUi';
import { C, R, themed } from '../../theme';

export default function OrderScreen() {
  const { id, celebrate } = useLocalSearchParams<{ id: string; celebrate?: string }>();
  const order = useShop((s) => s.orders.find((o) => o.id === id));
  const [party, setParty] = useState(celebrate === '1');
  if (!order) {
    return (
      <View style={{ flex: 1 }}>
        <Header title="Order" />
        <EmptyState icon="cube-outline" title="Order not found" />
      </View>
    );
  }
  const done = () => {
    setParty(false);
    // Drop the flag so a refresh or deep link shows tracking, not the celebration again.
    router.setParams({ celebrate: undefined });
  };
  return party ? <Celebrate order={order} onDone={done} /> : <OrderDetail order={order} />;
}

function Celebrate({ order, onDone }: { order: Order; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const lifetime = useShop((s) => keptInWallet(s.orders));
  const items = order.shops.reduce((n, s) => n + s.items.reduce((m, i) => m + i.qty, 0), 0);

  useEffect(() => {
    const t = setTimeout(success, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <LinearGradient colors={C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: insets.bottom + 24 }}>
        <Wrap style={{ maxWidth: 480, alignItems: 'center' }}>
          <Animated.View entering={ZoomIn.springify().damping(9)} style={styles.check}>
            <Ionicons name="checkmark" size={64} color={C.primary} />
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(200)} style={styles.bigTitle}>
            Order placed!
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300)} style={styles.sub}>
            {items} item{items > 1 ? 's' : ''} on the way from {order.shops.length} shop{order.shops.length > 1 ? 's' : ''}
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(450)} style={styles.wallet}>
            <Text style={styles.walletLabel}>Stayed in your wallet</Text>
            <Text style={styles.walletValue}>{peso(order.total)}</Text>
            <Text style={styles.walletNote}>
              That's {peso(lifetime)} not spent since you started using Pabili.
            </Text>
            <View style={styles.pills}>
              {order.saved > 0 && <Pill text={`Deals saved ${peso(order.saved)}`} />}
              <Pill text={`+${order.coinsEarned} coins`} coin />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)} style={{ width: '100%', gap: 10, marginTop: 24 }}>
            <Pressable style={styles.whiteBtn} onPress={onDone}>
              <Text style={styles.whiteBtnText}>Track Order</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={() => router.dismissTo('/')}>
              <Text style={styles.ghostBtnText}>Continue Shopping</Text>
            </Pressable>
          </Animated.View>
        </Wrap>
      </ScrollView>
      <Confetti seed={order.createdAt} />
    </LinearGradient>
  );
}

function Pill({ text, coin }: { text: string; coin?: boolean }) {
  return (
    <View style={styles.pill}>
      {coin && <Coin size={14} />}
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

function OrderDetail({ order }: { order: Order }) {
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const status = orderStatus(order, now);
  const steps = timeline(order, now);
  const route = routeProgress(order, now);
  const { cancelOrder, addToCart, returnOrder } = useShop.getState();
  const voucher = getVoucher(order.voucherId);
  const reviews = useShop((s) => s.reviews);
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const lines = order.shops.flatMap((s) => s.items);
  const unrated = lines.filter((l) => !reviews.some((r) => r.key === `${order.id}|${l.key}`)).length;
  const bundleDiscount = order.shops.reduce((n, s) => n + (s.bundleDiscount ?? 0), 0);
  const shopVoucherDiscount = order.shops.reduce((n, s) => n + (s.shopVoucherDiscount ?? 0), 0);

  const buyAgain = () => {
    for (const s of order.shops) {
      for (const { productId, variant, qty, unitPrice, unitOriginal } of s.items) {
        addToCart({ productId, variant, qty, unitPrice, unitOriginal });
      }
    }
    bump();
    toast('Added to cart again');
    router.navigate('/cart');
  };

  const banner: Record<typeof status, { title: string; sub: string; icon: IconName }> = {
    to_ship: { title: 'Preparing to ship', sub: 'The seller is packing your order', icon: 'cube-outline' },
    to_receive: { title: 'Order is on the way', sub: 'Your parcel is in transit', icon: 'bicycle-outline' },
    delivered: { title: 'Parcel delivered!', sub: 'Open your parcel to complete the order', icon: 'gift-outline' },
    completed: { title: 'Order completed', sub: 'Thanks for (pretend) shopping!', icon: 'checkmark-done-circle-outline' },
    cancelled: { title: 'Order cancelled', sub: 'Nothing was charged. Nothing ever is.', icon: 'close-circle-outline' },
    returned: { title: 'Returned & refunded', sub: 'Your ₱0 refund is complete', icon: 'return-down-back-outline' },
  };
  const b = banner[status];

  return (
    <View style={{ flex: 1 }}>
      <Header title="Order Details" />
      <ScrollView contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}>
        <Wrap>
          <LinearGradient colors={status === 'cancelled' || status === 'returned' ? ['#71717A', '#A1A1AA'] : C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.statusBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>{b.title}</Text>
              <Text style={styles.statusSub}>{b.sub}</Text>
            </View>
            <Ionicons name={b.icon} size={44} color="#fff" />
          </LinearGradient>

          {isLate(order) && steps.some((s) => s.title === 'Delivery delayed') && (
            <Pressable style={styles.late} onPress={() => router.push('/vouchers')}>
              <Ionicons name="time-outline" size={18} color={C.preferred} />
              <Text style={{ flex: 1, fontSize: 12, color: C.coinText }}>
                This parcel ran late, so we added a ₱50 voucher (LATE50) to your account.
              </Text>
              <Ionicons name="chevron-forward" size={14} color={C.coinText} />
            </Pressable>
          )}

          {route && (
            <View style={styles.card}>
              <Text style={[styles.cardTitle, { marginBottom: 8 }]}>Live Tracking</Text>
              <ParcelMap orderId={order.id} {...route} />
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Shipping Information</Text>
            <Text style={styles.small}>Pabili Xpress • Tracking no. {order.id.slice(2)}PH</Text>
            <View style={{ marginTop: 12 }}>
              {steps.map((s, i) => (
                <View key={s.title} style={styles.step}>
                  <View style={{ alignItems: 'center', width: 16 }}>
                    <View style={[styles.stepDot, i === 0 && { backgroundColor: status === 'cancelled' ? C.muted : C.ship }]} />
                    {i < steps.length - 1 && <View style={styles.stepLine} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 14 }}>
                    <Text style={[styles.stepTitle, i === 0 && { color: status === 'cancelled' ? C.text : C.ship, fontWeight: '600' }]}>
                      {s.title}
                    </Text>
                    <Text style={styles.small}>{s.detail}</Text>
                    <Text style={[styles.small, { color: C.faint }]}>{dateTime(s.at)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {order.gift && (
            <LinearGradient colors={getWrap(order.gift.wrap).colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.giftCard}>
              <View style={[styles.giftRibbon, { backgroundColor: getWrap(order.gift.wrap).ribbon }]} />
              <View style={styles.giftNote}>
                <Text style={styles.giftTo}>A gift for {order.gift.to}</Text>
                {!!order.gift.message && <Text style={styles.giftMsg}>“{order.gift.message}”</Text>}
                <Button
                  title="Send the gift link"
                  small
                  icon="share-social"
                  onPress={() => shareText(`${order.address.name.split(' ')[0]} sent you a gift on Pabili! Tap to unwrap:`, giftLink(order) ?? undefined)}
                />
              </View>
            </LinearGradient>
          )}

          <View style={[styles.card, { flexDirection: 'row', gap: 10 }]}>
            <Ionicons name="location-outline" size={18} color={C.primary} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.cardTitle}>Delivery Address</Text>
              <Text style={{ fontSize: 13, color: C.text }}>
                {order.address.name} {order.address.phone}
              </Text>
              <Text style={styles.small}>
                {order.address.line1}, {order.address.city}
              </Text>
            </View>
          </View>

          {order.shops.map((s) => {
            const shop = getShop(s.shopId);
            return (
              <View key={s.shopId} style={[styles.card, { paddingHorizontal: 0 }]}>
                <View style={styles.shopRow}>
                  <ShopTag shop={shop} />
                  <Text style={{ fontWeight: '600', color: C.text, flex: 1 }}>{shop.name}</Text>
                </View>
                {s.items.map((i) => {
                  const p = getProduct(i.productId);
                  return (
                    <Pressable key={i.key} style={styles.item} onPress={() => router.push(`/product/${i.productId}`)}>
                      {p && <ProductImage emoji={p.emoji} gradient={p.gradient} size={64} radius={R.sm} />}
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text numberOfLines={1} style={{ fontSize: 13, color: C.text }}>
                          {i.label}
                        </Text>
                        {!!variantLabel(i.variant) && <Text style={styles.small}>Variation: {variantLabel(i.variant)}</Text>}
                        <View style={{ flexDirection: 'row' }}>
                          <Text style={styles.small}>x{i.qty}</Text>
                          <View style={{ flex: 1 }} />
                          {i.unitOriginal > i.unitPrice && <Text style={styles.strike}>{peso(i.unitOriginal)}</Text>}
                          <Price value={i.unitPrice} size={13} />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
                {!!s.message && <Text style={[styles.small, { paddingHorizontal: 12, paddingTop: 4 }]}>Your message: “{s.message}”</Text>}
              </View>
            );
          })}

          <View style={[styles.card, { gap: 8 }]}>
            <Detail label="Merchandise Subtotal" value={peso(order.subtotal + bundleDiscount)} />
            {bundleDiscount > 0 && <Detail label="Bundle Deal" value={`-${peso(bundleDiscount)}`} />}
            {shopVoucherDiscount > 0 && <Detail label="Shop Vouchers" value={`-${peso(shopVoucherDiscount)}`} />}
            <Detail label="Shipping Fee" value={peso(order.shippingTotal)} />
            {order.shippingDiscount > 0 && <Detail label="Shipping Discount" value={`-${peso(order.shippingDiscount)}`} />}
            {order.voucherDiscount > 0 && <Detail label={`Voucher (${voucher?.id ?? ''})`} value={`-${peso(order.voucherDiscount)}`} />}
            {order.coinsUsed > 0 && <Detail label="Coins Redeemed" value={`-${peso(order.coinsUsed)}`} />}
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 14, color: C.text }}>Order Total</Text>
              <Price value={order.total} size={17} />
            </View>
          </View>

          <View style={[styles.card, { gap: 6 }]}>
            <Detail label="Order ID" value={order.id} />
            <Detail label="Payment Method" value={order.payment} />
            <Detail label="Order Time" value={dateTime(order.createdAt)} />
            {order.receivedAt && <Detail label="Completed" value={dateTime(order.receivedAt)} />}
            {order.cancelledAt && <Detail label="Cancelled" value={dateTime(order.cancelledAt)} />}
            {order.returnedAt && <Detail label="Returned" value={dateTime(order.returnedAt)} />}
          </View>
        </Wrap>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
        <Wrap style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 12 }}>
          {status === 'to_ship' && (
            <Button
              title="Cancel Order"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => {
                cancelOrder(order.id);
                toast('Order cancelled', 'close-circle');
              }}
            />
          )}
          {status === 'delivered' && (
            <Button title="Unbox Parcel" icon="gift" style={{ flex: 1 }} onPress={() => router.push(`/unbox/${order.id}`)} />
          )}
          {status === 'completed' && canReturn(order, now) && (
            <Button title="Return/Refund" variant="outline" style={{ flex: 1 }} onPress={() => setReturning(true)} />
          )}
          {status === 'completed' && unrated > 0 && (
            <Button title={`Rate (+${unrated * COINS_PER_REVIEW})`} style={{ flex: 1 }} onPress={() => router.push(`/rate/${order.id}`)} />
          )}
          {(status === 'to_receive' || status === 'cancelled' || status === 'returned' || (status === 'completed' && unrated === 0)) && (
            <Button title="Buy Again" style={{ flex: 1 }} onPress={buyAgain} />
          )}
        </Wrap>
      </View>

      <Sheet open={returning} onClose={() => setReturning(false)}>
        <View style={{ padding: 16, gap: 4 }}>
          <Text style={styles.sheetTitle}>Return/Refund</Text>
          <Text style={styles.small}>Free returns within 15 days (Pabili time: 15 minutes). Your refund is ₱0, as always.</Text>
        </View>
        {RETURN_REASONS.map((r) => (
          <Pressable key={r} style={styles.reason} onPress={() => setReason(r)}>
            <Text style={{ flex: 1, fontSize: 14, color: C.text }}>{r}</Text>
            <Ionicons name={reason === r ? 'radio-button-on' : 'radio-button-off'} size={20} color={reason === r ? C.primary : C.faint} />
          </Pressable>
        ))}
        <View style={{ padding: 16 }}>
          <Button
            title="Submit Return"
            onPress={() => {
              returnOrder(order.id, reason);
              setReturning(false);
              success();
              toast('Return accepted. ₱0 refunded.', 'return-down-back');
            }}
          />
        </View>
      </Sheet>
    </View>
  );
}

const RETURN_REASONS = ['Change of mind', 'Wrong size or color', 'Not as described', 'Received damaged item', 'Found it cheaper elsewhere'];

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={styles.small}>{label}</Text>
      <Text style={[styles.small, { color: C.text }]} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = themed(() => ({
  check: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  bigTitle: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 20 },
  sub: { color: '#fff', opacity: 0.9, marginTop: 6, fontSize: 14 },
  wallet: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, padding: 20, width: '100%', alignItems: 'center', marginTop: 28 },
  walletLabel: { color: '#fff', fontSize: 13, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1 },
  walletValue: { color: '#fff', fontSize: 42, fontWeight: '900', marginVertical: 4 },
  walletNote: { color: '#fff', fontSize: 13, textAlign: 'center', opacity: 0.95 },
  pills: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { color: C.primary, fontWeight: '700', fontSize: 12 },
  whiteBtn: { backgroundColor: '#fff', borderRadius: R.md, height: 48, alignItems: 'center', justifyContent: 'center' },
  whiteBtnText: { color: C.primary, fontWeight: '700', fontSize: 16 },
  ghostBtn: { borderColor: '#fff', borderWidth: 1.5, borderRadius: R.md, height: 48, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  statusTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  statusSub: { color: '#fff', fontSize: 13, marginTop: 2, opacity: 0.95 },
  card: { backgroundColor: C.card, marginBottom: 8, padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  small: { fontSize: 12, color: C.muted },
  step: { flexDirection: 'row', gap: 10 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D4D4D8', marginTop: 4 },
  stepLine: { width: 1, flex: 1, backgroundColor: C.line, marginVertical: 2 },
  stepTitle: { fontSize: 13, color: C.text },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  item: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.subtle },
  strike: { fontSize: 11, color: C.faint, textDecorationLine: 'line-through', marginRight: 6 },
  giftCard: { marginBottom: 8, padding: 16, alignItems: 'center' },
  giftRibbon: { position: 'absolute', top: 0, bottom: 0, width: 18 },
  giftNote: { backgroundColor: C.card, borderRadius: R.md, padding: 14, gap: 6, alignItems: 'center', width: '100%', maxWidth: 360 },
  giftTo: { fontSize: 15, fontWeight: '800', color: C.text },
  giftMsg: { fontSize: 13, color: C.muted, fontStyle: 'italic', textAlign: 'center' },
  late: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.coinSoft, padding: 12, marginBottom: 8 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  reason: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line, paddingTop: 8 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.card, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line, paddingTop: 8 },
}));
