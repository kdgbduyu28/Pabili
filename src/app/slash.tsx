import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Price } from '../components/bits';
import { Countdown } from '../components/Countdown';
import { Wrap, back } from '../components/Page';
import { ProductImage } from '../components/ProductImage';
import { PRODUCTS, defaultVariant, getProduct, hash, rng, variantLabel } from '../data/catalog';
import { dayKey } from '../data/promos';
import { dateTime, peso } from '../lib/format';
import { bump, success } from '../lib/haptics';
import { useNow } from '../lib/hooks';
import { shareText } from '../lib/share';
import { play } from '../lib/sound';
import { SlashCut, useShop } from '../store/useShop';
import { toast } from '../store/useUi';
import { C, R, themed } from '../theme';
import { t } from '../i18n';

const WINDOW_MS = 24 * 3600 * 1000;
/** Invites needed before a friend lands the final slash. */
const INVITES_TO_WIN = 5;
const FRIENDS = ['Ate Joy', 'Kuya Mark', 'Tita Baby', 'Bes Carla', 'Lolo Ben', 'Pinsan Rico', 'Tropa Jem', 'Ninang Liza', 'Mama Gina', 'Bunso Kiko'];

function todaysPicks(day: string) {
  const r = rng(hash(`slash:${day}`));
  const pool = PRODUCTS.filter((p) => p.price >= 199 && p.price <= 2499);
  return Array.from({ length: 6 }, () => pool.splice(Math.floor(r() * pool.length), 1)[0]);
}

function slashRemaining(start: number, cuts: SlashCut[], now: number) {
  return Math.max(0, start - cuts.filter((c) => c.at <= now).reduce((n, c) => n + c.amount, 0));
}

export default function Slash() {
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const slash = useShop((s) => s.slash);
  const day = dayKey(now);
  const picks = useMemo(() => todaysPicks(day), [day]);

  const active = slash && !slash.claimedAt && now - slash.startedAt < WINDOW_MS ? slash : null;
  const product = active ? getProduct(active.productId) : undefined;
  const remaining = active ? slashRemaining(active.start, active.cuts, now) : 0;
  const pending = active ? active.cuts.some((c) => c.at > now) : false;

  const start = (id: string) => {
    const p = getProduct(id)!;
    const first = Math.round(p.price * (0.3 + Math.random() * 0.1));
    useShop.getState().startSlash(id, p.price, { name: 'You', amount: first, at: Date.now() });
    success();
    play('whoosh');
    toast(`You slashed ${peso(first)}!`, 'cut');
  };

  const invite = async () => {
    if (!active || !product) return;
    await shareText(`Help me slash the price of ${product.name} on Pabili to ₱0!`);
    // Friends "click" the link a few seconds later. The last invite always finishes it.
    const left = slashRemaining(active.start, active.cuts, Number.MAX_SAFE_INTEGER);
    const final = active.invites + 1 >= INVITES_TO_WIN;
    const used = new Set(active.cuts.map((c) => c.name));
    const names = FRIENDS.filter((f) => !used.has(f)).sort(() => Math.random() - 0.5);
    const t = Date.now();
    const cuts: SlashCut[] = final
      ? [{ name: names[0] ?? 'A friend', amount: left, at: t + 4000 }]
      : [
          { name: names[0] ?? 'A friend', amount: Math.max(1, Math.round(left * (0.15 + Math.random() * 0.15))), at: t + 3000 + Math.random() * 4000 },
          ...(Math.random() < 0.5 ? [{ name: names[1] ?? 'Another friend', amount: Math.max(1, Math.round(left * 0.08)), at: t + 9000 + Math.random() * 8000 }] : []),
        ];
    useShop.getState().inviteToSlash(cuts);
    bump();
  };

  const claim = () => {
    if (!product) return;
    const v = defaultVariant(product);
    useShop.getState().startCheckout(
      [{ key: `${product.id}|${variantLabel(v)}`, productId: product.id, variant: v, qty: 1, unitPrice: 0, unitOriginal: product.originalPrice }],
      false,
      { slash: true },
    );
    router.push('/checkout');
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingTop: insets.top }}>
        <Wrap style={styles.top}>
          <Pressable onPress={back} hitSlop={10} accessibilityLabel={t("Back")}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Ionicons name="cut" size={20} color="#fff" style={{ marginLeft: 12 }} />
          <Text style={styles.headTitle}>{t("Slash It!")}</Text>
        </Wrap>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <Wrap style={{ maxWidth: 720 }}>
          {active && product ? (
            <>
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <ProductImage emoji={product.emoji} gradient={product.gradient} size={110} radius={R.md} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={{ fontSize: 14, color: C.text }} numberOfLines={2}>
                      {product.title}
                    </Text>
                    <Text style={styles.small}>
                      Started at <Text style={{ textDecorationLine: 'line-through' }}>{peso(active.start)}</Text>
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                      <Text style={styles.small}>{t("Now")}</Text>
                      <Price value={remaining} size={24} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.small}>{t("Ends in")}</Text>
                      <Countdown ms={active.startedAt + WINDOW_MS - now} />
                    </View>
                  </View>
                </View>
                <View style={styles.track}>
                  <LinearGradient
                    colors={C.grad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.fill, { width: `${Math.round((1 - remaining / active.start) * 100)}%` }]}
                  />
                </View>
                <Text style={[styles.small, { textAlign: 'center' }]}>
                  {remaining === 0 ? 'Slashed to ₱0! Claim it for free.' : `${peso(active.start - remaining)} slashed · ${peso(remaining)} to go`}
                </Text>
                {remaining === 0 ? (
                  <Button title={t("Claim for FREE")} icon="gift" onPress={claim} />
                ) : (
                  <Button title={pending ? 'Friends are slashing…' : 'Invite friends to slash'} icon="share-social" onPress={invite} />
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>{t("Slash history")}</Text>
                {active.cuts
                  .filter((c) => c.at <= now)
                  .reverse()
                  .map((c) => (
                    <Animated.View key={`${c.name}${c.at}`} entering={FadeInDown} style={styles.cut}>
                      <View style={[styles.avatar, c.name === 'You' && { backgroundColor: C.primary }]}>
                        <Text style={styles.avatarText}>{c.name === 'You' ? 'ME' : c.name.split(' ').pop()![0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, color: C.text }}>{c.name === 'You' ? 'You' : c.name} slashed</Text>
                        <Text style={styles.small}>{dateTime(c.at)}</Text>
                      </View>
                      <Text style={{ color: C.primary, fontWeight: '700' }}>-{peso(c.amount)}</Text>
                    </Animated.View>
                  ))}
              </View>
            </>
          ) : (
            <>
              <View style={[styles.card, { alignItems: 'center' }]}>
                <Text style={styles.cardTitle}>{t("Get it for ₱0")}</Text>
                <Text style={[styles.small, { textAlign: 'center' }]}>
                  Pick an item and slash the price. Invite friends to slash more. Hit ₱0 within 24 hours and it's yours, shipping included.
                </Text>
                {slash?.claimedAt && <Text style={{ color: C.success, fontWeight: '600', marginTop: 4 }}>{t("Your last slash prize is on its way!")}</Text>}
              </View>
              {picks.map((p) => (
                <View key={p.id} style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                  <ProductImage emoji={p.emoji} gradient={p.gradient} size={72} radius={R.sm} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text numberOfLines={2} style={{ fontSize: 13, color: C.text }}>
                      {p.title}
                    </Text>
                    <Text style={styles.small}>
                      <Text style={{ textDecorationLine: 'line-through' }}>{peso(p.price)}</Text> → <Text style={{ color: C.primary, fontWeight: '700' }}>₱0</Text>
                    </Text>
                  </View>
                  <Button title={t("Slash")} small icon="cut" onPress={() => start(p.id)} />
                </View>
              ))}
            </>
          )}
        </Wrap>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  top: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 14 },
  headTitle: { color: '#fff', fontWeight: '900', fontSize: 20, marginLeft: 6 },
  card: { backgroundColor: C.card, padding: 14, marginTop: 8, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  small: { fontSize: 12, color: C.muted },
  track: { height: 12, borderRadius: 6, backgroundColor: C.primarySoft, overflow: 'hidden' },
  fill: { height: 12, borderRadius: 6 },
  cut: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.preferred, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 11 },
}));
