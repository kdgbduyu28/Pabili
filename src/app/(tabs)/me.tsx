import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Row } from '../../components/bits';
import { CartButton } from '../../components/CartButton';
import { Coin } from '../../components/Icon';
import { Wrap } from '../../components/Page';
import { peso, todayKey } from '../../lib/format';
import { success } from '../../lib/haptics';
import { useNow } from '../../lib/hooks';
import { shareText } from '../../lib/share';
import { ACHIEVEMENTS } from '../../lib/achievements';
import { IconName } from '../../components/Icon';
import { ORDER_TABS, orderStatus, orderTab } from '../../lib/orders';
import { CHECKIN_REWARDS, keptInWallet, streak, useShop } from '../../store/useShop';
import { toast } from '../../store/useUi';
import { C, R, themed } from '../../theme';
import { t } from '../../i18n';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  to_ship: 'cube-outline',
  to_receive: 'car-outline',
  completed: 'checkmark-done-outline',
  cancelled: 'close-circle-outline',
};

const GAMES: { label: string; icon: IconName; href: '/spin' | '/shake' | '/slash' | '/live'; bg: string }[] = [
  { label: 'Spin & Win', icon: 'sync-circle', href: '/spin', bg: '#A855F7' },
  { label: 'Shake It', icon: 'phone-portrait', href: '/shake', bg: C.ship },
  { label: 'Slash It', icon: 'cut', href: '/slash', bg: C.primary },
  { label: 'Pabili Live', icon: 'videocam', href: '/live', bg: C.preferred },
];

export default function Me() {
  const insets = useSafeAreaInsets();
  const now = useNow(5000);
  const orders = useShop((s) => s.orders);
  const coins = useShop((s) => s.coins);
  const checkins = useShop((s) => s.checkins);
  const address = useShop((s) => s.address);
  const likes = useShop((s) => s.likes.length);
  const claimed = useShop((s) => s.claimed.length);

  const kept = keptInWallet(orders);
  const goal = useShop((s) => s.goal);
  const followed = useShop((s) => s.followed.length);
  const unlocked = useShop((s) => s.achievements);
  const badgeCount = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  const recentBadges = ACHIEVEMENTS.filter((a) => unlocked[a.id])
    .sort((a, b) => unlocked[b.id] - unlocked[a.id])
    .slice(0, 4);
  const saved = orders.filter((o) => !o.cancelledAt).reduce((n, o) => n + o.saved, 0);
  const items = orders
    .filter((o) => !o.cancelledAt)
    .reduce((n, o) => n + o.shops.reduce((m, s) => m + s.items.reduce((k, i) => k + i.qty, 0), 0), 0);
  const counts: Record<string, number> = {};
  for (const o of orders) {
    const t = orderTab(orderStatus(o, now));
    counts[t] = (counts[t] ?? 0) + 1;
  }

  const tier: { name: string; icon: keyof typeof Ionicons.glyphMap } =
    orders.length >= 20
      ? { name: 'Platinum', icon: 'diamond' }
      : orders.length >= 5
        ? { name: 'Gold', icon: 'medal' }
        : { name: 'Silver', icon: 'ribbon' };

  const checkedToday = checkins.includes(todayKey());
  const run = streak(checkins);
  // Day index in the 7-day reward strip that today's check-in lands on.
  const day = checkedToday ? (run - 1) % 7 : run % 7;

  return (
    <ScrollView>
      <LinearGradient colors={C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top }}>
        <Wrap style={styles.top}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }} />
            <CartButton />
          </View>
          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={34} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{address.name}</Text>
              <View style={styles.memberPill}>
                <Ionicons name={tier.icon} size={13} color="#fff" />
                <Text style={styles.memberText}>{t('{tier} Member', { tier: t(tier.name) })}</Text>
              </View>
            </View>
          </View>
        </Wrap>
      </LinearGradient>

      <Wrap>
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>{t("Kept in your wallet")}</Text>
          <Text style={styles.walletValue}>{peso(kept)}</Text>
          <Text style={styles.walletNote}>
            {orders.length === 0
              ? t('Place your first pretend order to start counting.')
              : t(items === 1 ? '{n} item "bought" • {saved} in deals • ₱0 spent' : '{n} items "bought" • {saved} in deals • ₱0 spent', { n: items, saved: peso(saved) })}
          </Text>
          {goal ? (
            <Pressable style={styles.goal} onPress={() => router.push('/goal')}>
              <View style={styles.goalHead}>
                <Ionicons name={goal.reachedAt ? 'trophy' : 'flag'} size={14} color={C.primary} />
                <Text style={styles.goalName} numberOfLines={1}>
                  {goal.name}
                </Text>
                <Text style={styles.goalPct}>
                  {peso(Math.min(kept, goal.amount))} / {peso(goal.amount)}
                </Text>
              </View>
              <View style={styles.goalTrack}>
                <LinearGradient
                  colors={C.grad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.goalFill, { width: `${Math.min(100, Math.round((kept / goal.amount) * 100))}%` }]}
                />
              </View>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/goal')} style={styles.goalCta}>
              <Ionicons name="flag-outline" size={14} color={C.primary} />
              <Text style={{ color: C.primary, fontSize: 12, fontWeight: '600' }}>{t("Set a savings goal for this money")}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <Row title={t("My Purchases")} value={t('View purchase history')} onPress={() => router.push('/orders')} />
          <View style={styles.tabs}>
            {ORDER_TABS.map((tab) => (
              <Pressable key={tab.id} style={styles.tab} onPress={() => router.push(`/orders?tab=${tab.id}`)}>
                <View>
                  <Ionicons name={TAB_ICONS[tab.id]} size={26} color={C.text} />
                  {!!counts[tab.id] && tab.id !== 'completed' && tab.id !== 'cancelled' && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{counts[tab.id]}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.tabLabel}>{t(tab.label)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { padding: 14 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Coin size={22} />
            <Text style={{ flex: 1, marginLeft: 8, fontSize: 15, fontWeight: '600', color: C.text }}>{t('{n} Pabili Coins', { n: coins })}</Text>
            <Ionicons name="flame" size={14} color={C.preferred} />
            <Text style={{ fontSize: 12, color: C.muted, marginLeft: 2 }}>{t('{n}-day streak', { n: run })}</Text>
          </View>
          <View style={styles.days}>
            {CHECKIN_REWARDS.map((r, i) => {
              const done = checkedToday ? i <= day : i < day;
              const isToday = i === day;
              return (
                <View key={i} style={[styles.day, done && styles.dayDone, isToday && !checkedToday && styles.dayToday]}>
                  <Text style={[styles.dayCoins, done && { color: '#fff' }]}>+{r}</Text>
                  {done ? <Ionicons name="checkmark-circle" size={18} color="#fff" /> : <Coin size={18} />}
                  <Text style={[styles.dayLabel, done && { color: '#fff' }]}>{isToday ? t('Today') : t('Day {n}', { n: i + 1 })}</Text>
                </View>
              );
            })}
          </View>
          <Pressable
            disabled={checkedToday}
            onPress={() => {
              const got = useShop.getState().checkIn();
              if (got) {
                success();
                toast(`+${got} Pabili Coins!`, 'coin');
              }
            }}
            style={[styles.checkBtn, checkedToday && { backgroundColor: C.faint }]}
          >
            <Text style={styles.checkText}>
              {checkedToday ? t('Come back tomorrow for more coins') : t('Check in today to get {n} coins', { n: CHECKIN_REWARDS[day] })}
            </Text>
          </Pressable>
        </View>

        <Pressable style={[styles.card, styles.trophies]} onPress={() => router.push('/achievements')}>
          <Ionicons name="trophy" size={22} color={C.coin} />
          <Text style={styles.trophyTitle}>
            Achievements <Text style={{ color: C.muted, fontWeight: '400' }}>{badgeCount}/{ACHIEVEMENTS.length}</Text>
          </Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {recentBadges.map((a) => (
              <View key={a.id} style={[styles.miniBadge, { backgroundColor: a.color }]}>
                <Ionicons name={a.icon} size={14} color="#fff" />
              </View>
            ))}
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.faint} />
        </Pressable>

        <View style={[styles.card, styles.games]}>
          {GAMES.map((g) => (
            <Pressable key={g.href} style={styles.game} onPress={() => router.push(g.href)}>
              <View style={[styles.gameIcon, { backgroundColor: g.bg }]}>
                <Ionicons name={g.icon} size={22} color="#fff" />
              </View>
              <Text style={styles.gameLabel}>{t(g.label)}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.card}>
          <Row icon="stats-chart-outline" title={t("My Pabili Wrapped")} value={t("This month's recap")} onPress={() => router.push('/wrapped')} />
          <Row icon="bag-handle-outline" title={t("My Haul")} value={t("Everything you've unboxed")} onPress={() => router.push('/haul')} />
          <Row icon="storefront-outline" title={t("Followed Shops")} value={followed ? `${followed}` : undefined} onPress={() => router.push('/following')} />
          <Row icon="heart-outline" title={t("My Likes")} value={likes ? `${likes}` : undefined} onPress={() => router.push('/likes')} />
          <Row icon="chatbubbles-outline" title={t("My Chats")} onPress={() => router.push('/chats')} />
          <Row icon="ticket-outline" title={t("My Vouchers")} value={claimed ? t('{n} claimed', { n: claimed }) : undefined} onPress={() => router.push('/vouchers')} />
          <Row icon="location-outline" title={t("My Address")} value={address.city} onPress={() => router.push('/address')} />
        </View>
        <View style={styles.card}>
          <Row
            icon="share-social-outline"
            title={t("Share my savings")}
            onPress={() => shareText(`I've "bought" ${items} things on Pabili and kept ${peso(kept)} in my wallet.`)}
          />
          <Row icon="settings-outline" title={t("Settings")} value={t('Sounds, cool-off, interests')} onPress={() => router.push('/settings')} />
        </View>
        <Text style={styles.footer}>{t("Pabili • a pretend shop. Nothing here costs real money.")}</Text>
      </Wrap>
    </ScrollView>
  );
}

const styles = themed(() => ({
  top: { paddingHorizontal: 16, paddingBottom: 48 },
  topRow: { flexDirection: 'row', height: 44, alignItems: 'center' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  name: { color: '#fff', fontSize: 18, fontWeight: '700' },
  memberPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.18)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: R.pill, marginTop: 6 },
  memberText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  walletCard: {
    backgroundColor: C.card,
    marginHorizontal: 12,
    marginTop: -36,
    marginBottom: 8,
    borderRadius: R.lg,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  walletLabel: { fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 },
  walletValue: { fontSize: 34, fontWeight: '900', color: C.primary, marginVertical: 2 },
  walletNote: { fontSize: 12, color: C.muted, textAlign: 'center' },
  card: { backgroundColor: C.card, marginBottom: 8 },
  tabs: { flexDirection: 'row', paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  tab: { flex: 1, alignItems: 'center', gap: 6 },
  tabLabel: { fontSize: 12, color: C.text },
  badge: { position: 'absolute', top: -4, right: -10, backgroundColor: C.primary, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  days: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, alignItems: 'center', backgroundColor: C.coinSoft, borderRadius: R.md, paddingVertical: 8, gap: 2 },
  dayDone: { backgroundColor: '#B45309' },
  dayToday: { borderWidth: 1.5, borderColor: C.coin },
  dayCoins: { fontSize: 11, fontWeight: '700', color: C.coinText },
  dayLabel: { fontSize: 9, color: C.muted },
  checkBtn: { backgroundColor: '#B45309', borderRadius: R.md, paddingVertical: 11, alignItems: 'center', marginTop: 12 },
  checkText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  goal: { width: '100%', marginTop: 12, gap: 6 },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalName: { flex: 1, fontSize: 12, fontWeight: '600', color: C.text },
  goalPct: { fontSize: 11, color: C.muted },
  goalTrack: { height: 8, borderRadius: 4, backgroundColor: C.primarySoft, overflow: 'hidden' },
  goalFill: { height: 8, borderRadius: 4 },
  goalCta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  trophies: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  trophyTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  miniBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  games: { flexDirection: 'row', paddingVertical: 14 },
  game: { flex: 1, alignItems: 'center', gap: 6 },
  gameIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  gameLabel: { fontSize: 11, color: C.text },
  footer: { textAlign: 'center', color: C.faint, fontSize: 11, paddingVertical: 20 },
}));
