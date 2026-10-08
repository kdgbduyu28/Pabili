import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/bits';
import { CartButton } from '../../components/CartButton';
import { Coin } from '../../components/Icon';
import { Wrap } from '../../components/Page';
import { ProductImage } from '../../components/ProductImage';
import { dateTime } from '../../lib/format';
import { NotifKind } from '../../lib/notifications';
import { useNotifications } from '../../lib/useNotifications';
import { useShop } from '../../store/useShop';
import { C, R, themed } from '../../theme';
import { t } from '../../i18n';

const FILTERS: { id: NotifKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'order', label: 'Orders' },
  { id: 'deal', label: 'Deals' },
  { id: 'coins', label: 'Coins' },
];

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const { list, seenAt } = useNotifications();
  const [filter, setFilter] = useState<NotifKind | 'all'>('all');
  // Keep this visit's unread dots visible; mark seen when leaving the tab.
  const visitSeenAt = useRef(seenAt);
  useFocusEffect(
    useCallback(() => {
      visitSeenAt.current = useShop.getState().notifSeenAt;
      return () => useShop.getState().markNotificationsSeen();
    }, []),
  );

  const shown = filter === 'all' ? list : list.filter((n) => n.kind === filter);

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Wrap style={styles.headerRow}>
          <Text style={styles.title}>{t("Notifications")}</Text>
          <Pressable hitSlop={8} onPress={() => router.push('/chats')} accessibilityLabel={t("Chats")} style={{ marginRight: 14 }}>
            <Ionicons name="chatbubbles-outline" size={24} color={C.primary} />
          </Pressable>
          <CartButton color={C.primary} />
        </Wrap>
        <Wrap style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable key={f.id} onPress={() => setFilter(f.id)} style={[styles.chip, filter === f.id && styles.chipOn]}>
              <Text style={[styles.chipText, filter === f.id && { color: '#fff' }]}>{t(f.label)}</Text>
            </Pressable>
          ))}
        </Wrap>
      </View>
      <ScrollView>
        <Wrap>
          {shown.length === 0 ? (
            <EmptyState icon="notifications-outline" title={t("Nothing here yet")} subtitle={t("Order updates, price drops and coin rewards will show up here.")} />
          ) : (
            shown.map((n) => {
              const unread = n.at > visitSeenAt.current;
              return (
                <Pressable
                  key={n.id}
                  onPress={() => router.push(n.href as Href)}
                  style={({ pressed }) => [styles.row, unread && styles.unread, pressed && { opacity: 0.8 }]}
                >
                  <View style={[styles.icon, { backgroundColor: n.tint }]}>
                    {n.icon === 'coin' ? <Coin size={22} /> : <Ionicons name={n.icon} size={20} color="#fff" />}
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.rowTitle}>{n.title}</Text>
                    <Text style={styles.body} numberOfLines={2}>
                      {n.body}
                    </Text>
                    <Text style={styles.time}>{dateTime(n.at)}</Text>
                  </View>
                  {n.product && <ProductImage emoji={n.product.emoji} gradient={n.product.gradient} size={52} radius={R.sm} />}
                  {unread && <View style={styles.dot} />}
                </Pressable>
              );
            })
          )}
        </Wrap>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  header: { backgroundColor: C.card, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  headerRow: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  title: { flex: 1, fontSize: 18, fontWeight: '600', color: C.text },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  chip: { borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: C.surface },
  chipOn: { backgroundColor: C.primary },
  chipText: { fontSize: 13, color: C.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: C.card, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  unread: { backgroundColor: C.primarySoft },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  body: { fontSize: 12, color: C.muted, lineHeight: 17 },
  time: { fontSize: 11, color: C.faint },
  dot: { position: 'absolute', top: 12, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
}));
