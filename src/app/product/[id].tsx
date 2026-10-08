import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { GestureResponderEvent, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Price, QtyStepper, SectionTitle, ShopTag, Stars, Tag } from '../../components/bits';
import { CartButton } from '../../components/CartButton';
import { Countdown } from '../../components/Countdown';
import { PriceChart } from '../../components/PriceChart';
import { ShopAvatar } from '../../components/Icon';
import { Wrap, back } from '../../components/Page';
import { ProductCard } from '../../components/ProductCard';
import { ProductGrid } from '../../components/ProductGrid';
import { ProductImage } from '../../components/ProductImage';
import { Sheet } from '../../components/Sheet';
import {
  Product,
  boughtTogether,
  defaultVariant,
  fromShop,
  getProduct,
  getShop,
  reviewsFor,
  similar,
  sizeChartFor,
  variantLabel,
} from '../../data/catalog';
import { botReply } from '../../data/chatbot';
import { isPreorder, priceHistory, qaFor, restockAt, soldOut } from '../../data/extras';
import { MEGA_EXTRA_PCT, SLOT_MS, activeFlash, bundleFor, flashProgress, shopVoucher, slotStart, unitPrice } from '../../data/promos';
import { baseShipping, deliveryDays } from '../../lib/checkout';
import { compact, deliveryWindow, peso, shortDate, soldLabel } from '../../lib/format';
import { bump, success, tap, warn } from '../../lib/haptics';
import { useGrid, useMeasuredWidth, useNow } from '../../lib/hooks';
import { Question, useShop } from '../../store/useShop';
import { toast, useUi } from '../../store/useUi';
import { C, R, themed } from '../../theme';

type Mode = 'cart' | 'buy';

const NO_QUESTIONS: Question[] = [];

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = getProduct(id);
  if (!p) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState icon="help-circle-outline" title="This product vanished" subtitle="It was never real anyway." />
      </View>
    );
  }
  return <ProductDetail key={p.id} p={p} />;
}

function priceRange(p: Product, now: number): [number, number] {
  const prices: number[] = [];
  const combos = (i: number, acc: Record<string, string>) => {
    if (i === p.variants.length) return prices.push(unitPrice(p, acc, now).price);
    for (const o of p.variants[i].options) combos(i + 1, { ...acc, [p.variants[i].name]: o });
  };
  combos(0, {});
  return [Math.min(...prices), Math.max(...prices)];
}

function ProductDetail({ p }: { p: Product }) {
  const insets = useSafeAreaInsets();
  const { wide } = useGrid();
  const { width: avail, onLayout } = useMeasuredWidth();
  const now = useNow();
  const shop = getShop(p.shopId);
  const flash = activeFlash(p.id, now);
  const liked = useShop((s) => s.likes.includes(p.id));
  const toggleLike = useShop((s) => s.toggleLike);
  const [imgIndex, setImgIndex] = useState(0);
  const [mode, setMode] = useState<Mode | null>(null);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const related = useMemo(() => similar(p, 12), [p]);
  const reviews = useMemo(() => reviewsFor(p), [p]);
  const allReviews = useShop((s) => s.reviews);
  const myReviews = useMemo(() => allReviews.filter((r) => r.productId === p.id), [allReviews, p.id]);
  const shopClaimed = useShop((s) => s.shopVouchers.includes(p.shopId));
  const more = useMemo(() => fromShop(p), [p]);
  const fbt = useMemo(() => boughtTogether(p), [p]);
  const chart = sizeChartFor(p);
  const bundle = bundleFor(p);
  const sv = shopVoucher(shop);
  const [chartOpen, setChartOpen] = useState(false);
  const today = unitPrice(p, {}, now);
  const out = soldOut(p, now);
  const restock = restockAt(p, now);
  const preorder = isPreorder(p);
  const alertOn = useShop((s) => s.restockAlerts.includes(p.id));
  const myQs = useShop((s) => s.questions[p.id]) ?? NO_QUESTIONS;
  const qa = useMemo(() => qaFor(p), [p]);
  const [question, setQuestion] = useState('');
  const history = priceHistory(p, now);
  const histLow = history.reduce((m, h) => (h.price < m.price ? h : m), history[0]);
  const lowestToday = history[history.length - 1].price <= histLow.price;

  const ask = () => {
    const q = question.trim();
    if (!q) return;
    const id = `q${Date.now()}`;
    useShop.getState().askQuestion(p.id, { id, q, by: 'You', at: Date.now(), mine: true });
    setQuestion('');
    tap();
    setTimeout(() => useShop.getState().answerQuestion(p.id, id, botReply(shop, q)), 2500);
  };

  useEffect(() => {
    useShop.getState().viewProduct(p.id);
  }, [p.id]);
  const [lo, hi] = priceRange(p, now);
  const original = unitPrice(p, {}, now).original;
  const pct = Math.round((1 - lo / original) * 100);
  const [d1, d2] = deliveryDays(shop, false);

  const imgSize = wide ? Math.min(460, avail * 0.42) : avail;
  const images = [0, 1, 2];

  const open = (m: Mode) => {
    tap();
    setMode(m);
  };

  const missing = p.variants.find((g) => !choice[g.name]);
  const selPrice = unitPrice(p, choice, now);

  const confirm = (e: GestureResponderEvent) => {
    if (missing) {
      warn();
      toast(`Please select ${missing.name}`, 'hand-left-outline');
      return;
    }
    const line = {
      productId: p.id,
      variant: choice,
      qty,
      unitPrice: selPrice.price,
      unitOriginal: selPrice.original,
    };
    if (mode === 'buy') {
      setMode(null);
      useShop.getState().startCheckout([{ ...line, key: `${p.id}|${variantLabel(choice)}` }], false);
      router.push('/checkout');
      return;
    }
    useShop.getState().addToCart(line);
    const from = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    setMode(null);
    bump();
    useUi.getState().flyToCart(p.emoji, p.gradient, from);
    toast('Item has been added to your shopping cart');
  };

  const gallery = (
    <View style={{ width: imgSize }}>
      {out && (
        <View style={[styles.soldOut, { width: imgSize, height: imgSize }]} pointerEvents="none">
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        </View>
      )}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setImgIndex(Math.round(e.nativeEvent.contentOffset.x / imgSize))}
      >
        {images.map((i) => (
          <ProductImage key={i} emoji={p.emoji} gradient={p.gradient} size={imgSize} angle={i} />
        ))}
      </ScrollView>
      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {imgIndex + 1}/{images.length}
        </Text>
      </View>
    </View>
  );

  const info = (
    <View style={{ flex: 1 }}>
      {flash && (
        <LinearGradient colors={C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.flashBar}>
          <Ionicons name="flash" size={16} color="#fff" />
          <Text style={styles.flashBarTitle}>FLASH SALE</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.flashEnds}>ENDS IN</Text>
          <Countdown ms={slotStart(now) + SLOT_MS - now} />
        </LinearGradient>
      )}
      <View style={styles.block}>
        <View style={styles.priceRow}>
          <Price value={lo} size={26} />
          {hi > lo && <Text style={styles.priceHi}> - {peso(hi)}</Text>}
          {pct > 0 && <Text style={styles.orig}>{peso(original)}</Text>}
          {pct > 0 && <Tag text={`-${pct}%`} color={C.primary} bg="#FFE5E9" style={{ marginLeft: 6 }} />}
        </View>
        {(today.drop > 0 || today.mega) && (
          <View style={[styles.flashLeftRow, { gap: 6 }]}>
            {today.drop > 0 && <Tag text={`Price drop today: -${today.drop}%`} color="#fff" bg={C.success} />}
            {today.mega && <Tag text={`Mega Day: extra -${MEGA_EXTRA_PCT}%`} color="#fff" bg={C.primary} />}
          </View>
        )}
        {flash && (
          <View style={styles.flashLeftRow}>
            <Ionicons name="flame" size={14} color={C.primary} />
            <Text style={styles.flashLeft}>
              {Math.round(flashProgress(flash, now) * 100)}% claimed. Grab it before it's gone!
            </Text>
          </View>
        )}
        <Text style={styles.title}>
          {shop.mall || shop.preferred ? (
            <Text style={[styles.inlineTag, { backgroundColor: shop.mall ? C.mall : C.preferred }]}>
              {shop.mall ? ' Mall ' : ' Preferred '}
            </Text>
          ) : null}{' '}
          {p.title}
        </Text>
        <View style={styles.metaRow}>
          <Stars rating={p.rating} />
          <Text style={styles.meta}>
            {p.rating.toFixed(1)} | {compact(p.ratingCount)} ratings | {soldLabel(p.sold)}
          </Text>
          <View style={{ flex: 1 }} />
          <Pressable
            hitSlop={10}
            onPress={() => {
              bump();
              toggleLike(p.id);
              if (!liked) toast('Added to My Likes', 'heart');
            }}
          >
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={24} color={liked ? C.primary : C.muted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.block}>
        <Pressable
          disabled={shopClaimed}
          onPress={() => {
            success();
            useShop.getState().claimShopVoucher(shop.id);
            toast(`Shop voucher claimed: ${peso(sv.value)} off ${peso(sv.minSpend)}`, 'pricetag');
          }}
        >
          <InfoRow icon="pricetags-outline" title="Shop Vouchers">
            <Tag text={`${peso(sv.value)} off ${peso(sv.minSpend)}`} color={C.primary} border={C.primary} />
            <Text style={[styles.small, { color: shopClaimed ? C.muted : C.primary, fontWeight: '600' }]}>
              {shopClaimed ? 'Claimed' : 'Tap to claim'}
            </Text>
          </InfoRow>
        </Pressable>
        {bundle && (
          <InfoRow icon="layers-outline" title="Bundle Deal">
            {bundle.map((t) => (
              <Tag key={t.qty} text={`Buy ${t.qty}, save ${t.pct}%`} color="#fff" bg={C.preferred} />
            ))}
          </InfoRow>
        )}
        <InfoRow icon="car-outline" title={p.freeShipping ? 'Free Shipping' : `Shipping: ${peso(baseShipping(shop))}`}>
          <Text style={styles.small}>
            Get by {deliveryWindow(d1, d2)} • from {shop.location}
          </Text>
        </InfoRow>
        {preorder && (
          <InfoRow icon="time-outline" title="Pre-order">
            <Text style={styles.small}>Made to order: ships in 7–10 days after checkout</Text>
          </InfoRow>
        )}
        <InfoRow icon="shield-checkmark-outline" title="Pabili Guarantee">
          <Text style={styles.small}>{p.cod ? 'Cash on Delivery • ' : ''}15-day free returns • 100% pretend</Text>
        </InfoRow>
        {chart && (
          <Pressable onPress={() => setChartOpen(true)}>
            <InfoRow icon="resize-outline" title="Size Chart" chevron>
              <Text style={styles.small}>Find your fit before you buy</Text>
            </InfoRow>
          </Pressable>
        )}
        {p.variants.length > 0 && (
          <Pressable onPress={() => open('cart')}>
            <InfoRow icon="color-palette-outline" title="Select Variation" chevron>
              <Text style={styles.small} numberOfLines={1}>
                {p.variants.map((g) => `${g.name} (${g.options.length})`).join(' • ')}
              </Text>
            </InfoRow>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 72 + insets.bottom }}>
        <Wrap onLayout={onLayout}>
          {wide ? (
            <View style={[styles.block, { flexDirection: 'row', gap: 16, paddingTop: insets.top + 56, paddingHorizontal: 12 }]}>
              {gallery}
              {info}
            </View>
          ) : (
            <>
              {gallery}
              {info}
            </>
          )}

          <View style={[styles.block, styles.shop]}>
            <ShopAvatar shop={shop} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <ShopTag shop={shop} />
              <Text style={styles.small}>
                {shop.location} • {shop.rating} rating • {compact(shop.followers)} followers
              </Text>
            </View>
            <Button title="View Shop" variant="outline" small onPress={() => router.push(`/shop/${shop.id}`)} />
          </View>

          <View style={styles.block}>
            <SectionTitle title="Frequently Bought Together" />
            <View style={styles.fbt}>
              {[p, ...fbt].map((x, i) => (
                <View key={x.id} style={styles.fbtItem}>
                  {i > 0 && <Ionicons name="add" size={18} color={C.muted} style={styles.fbtPlus} />}
                  <Pressable onPress={() => x.id !== p.id && router.push(`/product/${x.id}`)}>
                    <ProductImage emoji={x.emoji} gradient={x.gradient} size={84} radius={R.sm} />
                  </Pressable>
                  <Text style={styles.fbtPrice}>{peso(unitPrice(x, {}, now).price)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.fbtBar}>
              <Text style={{ flex: 1, fontSize: 13, color: C.text }}>
                Total for 3: <Text style={{ color: C.primary, fontWeight: '700' }}>{peso([p, ...fbt].reduce((n, x) => n + unitPrice(x, {}, now).price, 0))}</Text>
              </Text>
              <Button
                title="Add all 3 to cart"
                small
                onPress={(e) => {
                  for (const x of [p, ...fbt]) {
                    const v = defaultVariant(x);
                    const u = unitPrice(x, v, now);
                    useShop.getState().addToCart({ productId: x.id, variant: v, qty: 1, unitPrice: u.price, unitOriginal: u.original });
                  }
                  bump();
                  useUi.getState().flyToCart(p.emoji, p.gradient, { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
                  toast('3 items added to your cart');
                }}
              />
            </View>
          </View>

          {more.length > 0 && (
            <View style={styles.block}>
              <SectionTitle title={`More from ${shop.name}`} right="See all" onPress={() => router.push(`/shop/${shop.id}`)} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 8, paddingBottom: 12 }}>
                {more.map((x) => (
                  <ProductCard key={x.id} product={x} width={140} now={now} />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.block}>
            <SectionTitle title="Price History · 30 days" />
            <View style={{ paddingHorizontal: 12, paddingBottom: 14, gap: 8 }}>
              {lowestToday ? (
                <Tag text="Lowest price in 30 days!" color="#fff" bg={C.success} />
              ) : (
                <Text style={styles.small}>
                  Lowest was {peso(histLow.price)} on {shortDate(new Date(histLow.at))}. Today is {peso(history[history.length - 1].price)}.
                </Text>
              )}
              <PriceChart points={history} />
            </View>
          </View>

          <View style={styles.block}>
            <SectionTitle title="Product Description" />
            <Text style={styles.desc}>{p.description}</Text>
          </View>

          <View style={styles.block}>
            <SectionTitle title={`Product Ratings ${p.rating.toFixed(1)}/5`} right={`${compact(p.ratingCount)} reviews`} />
            {myReviews.map((r) => (
              <View key={r.key} style={styles.review}>
                <View style={[styles.reviewAvatar, { backgroundColor: C.primary }]}>
                  <Ionicons name="person" size={16} color="#fff" />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontSize: 12, color: C.text, fontWeight: '600' }}>You</Text>
                  <Stars rating={r.rating} size={11} />
                  {r.variant ? <Text style={styles.small}>Variation: {r.variant}</Text> : null}
                  {r.tags.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      {r.tags.map((t) => (
                        <Tag key={t} text={t} color={C.muted} border={C.line} />
                      ))}
                    </View>
                  )}
                  {!!r.text && <Text style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{r.text}</Text>}
                </View>
              </View>
            ))}
            {reviews.map((r, i) => (
              <View key={i} style={styles.review}>
                <View style={styles.reviewAvatar}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{r.user[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontSize: 12, color: C.text }}>{r.user}</Text>
                  <Stars rating={r.rating} size={11} />
                  {r.variant ? <Text style={styles.small}>Variation: {r.variant}</Text> : null}
                  <Text style={{ fontSize: 13, color: C.text, marginTop: 2 }}>{r.text}</Text>
                  <Text style={[styles.small, { color: C.faint }]}>{r.daysAgo} days ago</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.block}>
            <SectionTitle title={`Questions & Answers (${qa.length + myQs.length})`} />
            {[...myQs.map((q) => ({ ...q, daysAgo: 0, a: q.a ?? '' })), ...qa].map((q) => (
              <View key={q.id} style={styles.qa}>
                <Text style={styles.qText}>
                  <Text style={styles.qBadge}>Q </Text>
                  {q.q}
                </Text>
                <Text style={styles.aText}>
                  <Text style={[styles.qBadge, { color: C.ship }]}>A </Text>
                  {q.a || 'The seller is typing an answer…'}
                </Text>
                <Text style={[styles.small, { color: C.faint }]}>
                  Asked by {q.by}
                  {q.daysAgo ? ` · ${q.daysAgo} days ago` : ' · just now'}
                </Text>
              </View>
            ))}
            <View style={styles.askRow}>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                onSubmitEditing={ask}
                placeholder="Ask the seller a question"
                placeholderTextColor={C.faint}
                returnKeyType="send"
                style={styles.askInput}
              />
              <Button title="Ask" small onPress={ask} />
            </View>
          </View>

          <SectionTitle title="YOU MAY ALSO LIKE" />
          <ProductGrid products={related} keyPrefix="rel" />
        </Wrap>
      </ScrollView>

      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <Wrap style={styles.topBarRow}>
          <Pressable onPress={back} style={styles.roundBtn} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => router.push('/search')} style={styles.roundBtn} accessibilityLabel="Search">
            <Ionicons name="search" size={20} color="#fff" />
          </Pressable>
          <View style={styles.roundBtn}>
            <CartButton size={22} />
          </View>
        </Wrap>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <Wrap style={{ flexDirection: 'row', height: 56 }}>
          <Pressable style={styles.barBtn} onPress={() => router.push(`/chat/${shop.id}?product=${p.id}`)}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={C.ship} />
            <Text style={[styles.barBtnText, { color: C.ship }]}>Chat</Text>
          </Pressable>
          <View style={styles.divider} />
          {out ? (
            <Pressable
              style={{ flex: 3 }}
              onPress={() => {
                const on = useShop.getState().toggleRestock(p.id);
                bump();
                if (on) toast("We'll let you know when it's back", 'notifications');
              }}
            >
              <LinearGradient colors={alertOn ? ['#71717A', '#A1A1AA'] : C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buyNow}>
                <Text style={styles.buyNowText}>{alertOn ? 'Restock alert on' : 'Notify Me When Back'}</Text>
                {restock && (
                  <Text style={styles.buyNowSub}>
                    Restocks at {new Date(restock).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.barBtn} onPress={() => open('cart')}>
                <Ionicons name="cart-outline" size={22} color={C.ship} />
                <Text style={[styles.barBtnText, { color: C.ship }]}>Add to Cart</Text>
              </Pressable>
              <Pressable style={{ flex: 2 }} onPress={() => open('buy')}>
                <LinearGradient colors={C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buyNow}>
                  <Text style={styles.buyNowText}>{preorder ? 'Pre-order Now' : 'Buy Now'}</Text>
                  {flash && <Text style={styles.buyNowSub}>{peso(lo)} flash price</Text>}
                </LinearGradient>
              </Pressable>
            </>
          )}
        </Wrap>
      </View>

      <Sheet open={mode !== null} onClose={() => setMode(null)}>
        <View style={styles.sheetHead}>
          <ProductImage emoji={p.emoji} gradient={p.gradient} size={96} radius={R.sm} style={{ marginTop: -36 }} />
          <View style={{ flex: 1, justifyContent: 'flex-end', gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Price value={missing ? lo : selPrice.price} size={20} />
              {selPrice.original > selPrice.price && <Text style={styles.orig}>{peso(missing ? original : selPrice.original)}</Text>}
            </View>
            <Text style={styles.small}>Stock: {p.stock}</Text>
            {!!variantLabel(choice) && <Text style={styles.small}>Selected: {variantLabel(choice)}</Text>}
          </View>
          <Pressable onPress={() => setMode(null)} hitSlop={10} style={{ alignSelf: 'flex-start' }}>
            <Ionicons name="close" size={24} color={C.muted} />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingHorizontal: 14 }}>
          {p.variants.map((g) => (
            <View key={g.name} style={{ marginBottom: 14 }}>
              <Text style={styles.groupName}>{g.name}</Text>
              <View style={styles.options}>
                {g.options.map((o) => {
                  const on = choice[g.name] === o;
                  return (
                    <Pressable
                      key={o}
                      onPress={() => {
                        tap();
                        setChoice((c) => ({ ...c, [g.name]: o }));
                      }}
                      style={[styles.option, on && styles.optionOn]}
                    >
                      <Text style={[styles.optionText, on && { color: C.primary }]}>{o}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={styles.qtyRow}>
            <Text style={styles.groupName}>Quantity</Text>
            <QtyStepper value={qty} onChange={setQty} max={p.stock} />
          </View>
        </ScrollView>
        <View style={{ paddingHorizontal: 14, paddingTop: 8 }}>
          <Pressable onPress={confirm} style={({ pressed }) => [{ opacity: missing ? 0.5 : pressed ? 0.85 : 1 }]}>
            <LinearGradient colors={C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirm}>
              <Text style={styles.buyNowText}>{mode === 'buy' ? 'Buy Now' : 'Add to Cart'}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </Sheet>
      <Sheet open={chartOpen} onClose={() => setChartOpen(false)}>
        {chart && (
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 12 }}>Size Chart</Text>
            <View style={styles.chartRow}>
              {chart.columns.map((c) => (
                <Text key={c} style={[styles.chartCell, styles.chartHead]}>
                  {c}
                </Text>
              ))}
            </View>
            {chart.rows.map((r) => (
              <View key={r[0]} style={styles.chartRow}>
                {r.map((c, i) => (
                  <Text key={i} style={[styles.chartCell, i === 0 && { fontWeight: '700' }]}>
                    {c}
                  </Text>
                ))}
              </View>
            ))}
            <Text style={[styles.small, { marginTop: 10 }]}>Measurements may vary by 1–2 cm. Pretend sizes always fit.</Text>
          </View>
        )}
      </Sheet>
    </View>
  );
}

function InfoRow({
  icon,
  title,
  children,
  chevron,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children?: React.ReactNode;
  chevron?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={C.ship} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 13, color: C.text, fontWeight: '500' }}>{title}</Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>{children}</View>
      </View>
      {chevron && <Ionicons name="chevron-forward" size={16} color={C.faint} />}
    </View>
  );
}

const styles = themed(() => ({
  block: { backgroundColor: C.card, marginBottom: 8 },
  counter: { position: 'absolute', right: 12, bottom: 12, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 2 },
  counterText: { color: '#fff', fontSize: 12 },
  flashBar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8 },
  flashBarTitle: { color: '#fff', fontWeight: '900', fontStyle: 'italic', fontSize: 15 },
  flashEnds: { color: '#fff', fontSize: 11, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 12 },
  priceHi: { color: C.primary, fontSize: 20, fontWeight: '600' },
  orig: { color: C.faint, textDecorationLine: 'line-through', fontSize: 13, marginLeft: 8 },
  flashLeftRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, marginTop: 4 },
  flashLeft: { color: C.primary, fontSize: 12 },
  title: { fontSize: 16, lineHeight: 22, color: C.text, paddingHorizontal: 12, marginTop: 8 },
  inlineTag: { color: '#fff', fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12 },
  meta: { fontSize: 12, color: C.muted },
  infoRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  small: { fontSize: 12, color: C.muted },
  shop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  shopName: { fontSize: 15, fontWeight: '600', color: C.text },
  desc: { fontSize: 13, lineHeight: 20, color: C.text, paddingHorizontal: 12, paddingBottom: 16 },
  review: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  reviewAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.faint, alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  roundBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.32)', alignItems: 'center', justifyContent: 'center' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.card, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  barBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: C.shipBg },
  barBtnText: { fontSize: 11 },
  divider: { width: StyleSheet.hairlineWidth, backgroundColor: C.line },
  buyNow: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buyNowText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  buyNowSub: { color: '#fff', fontSize: 11 },
  sheetHead: { flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line, marginBottom: 12 },
  groupName: { fontSize: 14, color: C.text, marginBottom: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 7 },
  optionOn: { borderColor: C.primary, backgroundColor: C.primarySoft },
  optionText: { fontSize: 13, color: C.text },
  fbt: { flexDirection: 'row', paddingHorizontal: 12, gap: 6 },
  fbtItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  fbtPlus: { marginTop: 32 },
  fbtPrice: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 3, paddingHorizontal: 4, fontSize: 11, color: C.primary, fontWeight: '700' },
  fbtBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  chartRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  chartCell: { flex: 1, paddingVertical: 8, fontSize: 13, color: C.text, textAlign: 'center' },
  chartHead: { fontWeight: '700', backgroundColor: C.subtle, color: C.muted, fontSize: 12 },
  soldOut: { position: 'absolute', zIndex: 2, backgroundColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center' },
  soldOutBadge: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  soldOutText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  qa: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line, gap: 4 },
  qText: { fontSize: 13, color: C.text, fontWeight: '600' },
  aText: { fontSize: 13, color: C.text },
  qBadge: { color: C.primary, fontWeight: '900' },
  askRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  askInput: { flex: 1, height: 36, backgroundColor: C.surface, borderRadius: 18, paddingHorizontal: 14, fontSize: 13, color: C.text },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  confirm: { height: 46, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center' },
}));
