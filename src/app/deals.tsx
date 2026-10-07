import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Price } from '../components/bits';
import { CartButton } from '../components/CartButton';
import { Countdown } from '../components/Countdown';
import { Wrap, back } from '../components/Page';
import { ProductImage } from '../components/ProductImage';
import { SLOT_MS, flashDeals, flashProgress, slotStart } from '../data/promos';
import { pad2, peso } from '../lib/format';
import { tap } from '../lib/haptics';
import { useNow } from '../lib/hooks';
import { toast } from '../store/useUi';
import { C, R } from '../theme';

export default function Deals() {
  const insets = useSafeAreaInsets();
  const now = useNow();
  const [offset, setOffset] = useState(0);
  const [reminded, setReminded] = useState<Set<number>>(new Set());
  const current = slotStart(now);
  const start = slotStart(now, offset);
  const deals = flashDeals(start);
  const live = offset === 0;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingTop: insets.top }}>
        <Wrap style={styles.headRow}>
          <Pressable onPress={back} hitSlop={10} accessibilityLabel="Back" style={{ marginRight: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Ionicons name="flash" size={22} color="#fff" />
          <Text style={styles.headTitle}>FLASH DEALS</Text>
          <View style={{ flex: 1 }} />
          <CartButton />
        </Wrap>
        <Wrap>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[0, 1, 2, 3].map((o) => {
              const s = new Date(slotStart(now, o));
              const on = o === offset;
              return (
                <Pressable
                  key={o}
                  onPress={() => {
                    tap();
                    setOffset(o);
                  }}
                  style={[styles.slot, on && styles.slotOn]}
                >
                  <Text style={[styles.slotTime, on && { color: C.primary }]}>
                    {pad2(s.getHours())}:00
                  </Text>
                  <Text style={[styles.slotLabel, on && { color: C.primary }]}>{o === 0 ? 'Ongoing' : 'Coming Soon'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Wrap>
      </LinearGradient>

      <ScrollView>
        <Wrap>
          <View style={styles.timer}>
            <Text style={{ color: C.text, fontSize: 13 }}>{live ? 'Ends in' : 'Starts in'}</Text>
            <Countdown ms={live ? current + SLOT_MS - now : start - now} />
          </View>
          {deals.map((d) => {
            const progress = live ? flashProgress(d, now) : 0;
            const pct = Math.round((1 - d.flashPrice / d.product.originalPrice) * 100);
            const remind = reminded.has(start);
            return (
              <Pressable key={d.product.id} style={styles.row} onPress={() => router.push(`/product/${d.product.id}`)}>
                <View>
                  <ProductImage emoji={d.product.emoji} gradient={d.product.gradient} size={110} radius={R.sm} />
                  <View style={styles.off}>
                    <Text style={styles.offText}>-{pct}%</Text>
                  </View>
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text numberOfLines={2} style={styles.title}>
                    {d.product.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    {live ? (
                      <Price value={d.flashPrice} size={18} />
                    ) : (
                      // Upcoming prices stay hidden until the slot opens, like the real flash sales.
                      <Text style={styles.mystery}>₱{String(d.flashPrice).replace(/\d(?=\d)/g, '?')}</Text>
                    )}
                    <Text style={styles.orig}>{peso(d.product.originalPrice)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.bar, { flex: 1 }]}>
                      {live && (
                        <LinearGradient
                          colors={C.grad}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[StyleSheet.absoluteFill, { width: `${Math.round(progress * 100)}%`, borderRadius: 8 }]}
                        />
                      )}
                      <Text style={[styles.barText, !live && { color: C.primary }]}>
                        {live ? (progress > 0.85 ? 'ALMOST GONE' : `${Math.round(d.total * progress)} SOLD`) : `${d.total} available`}
                      </Text>
                    </View>
                    {live ? (
                      <Pressable style={styles.buy} onPress={() => router.push(`/product/${d.product.id}`)}>
                        <Text style={styles.buyText}>Buy Now</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[styles.buy, remind ? styles.reminded : styles.remind]}
                        onPress={() => {
                          tap();
                          setReminded((r) => new Set(r).add(start));
                          if (!remind) toast("Reminder set. We'll pretend to notify you.", 'alarm');
                        }}
                      >
                        <Text style={[styles.buyText, !remind && { color: C.primary }]}>{remind ? 'Reminded' : 'Remind Me'}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </Wrap>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 52, paddingHorizontal: 14 },
  headTitle: { color: '#fff', fontWeight: '900', fontStyle: 'italic', fontSize: 20 },
  slot: { width: 96, alignItems: 'center', paddingVertical: 8 },
  slotOn: { backgroundColor: '#fff', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  slotTime: { color: '#fff', fontSize: 18, fontWeight: '700' },
  slotLabel: { color: '#fff', fontSize: 11 },
  timer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.card, paddingVertical: 10, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, backgroundColor: C.card, padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  off: { position: 'absolute', top: 0, right: 0, backgroundColor: '#FFE5E9', paddingHorizontal: 5, paddingVertical: 2, borderBottomLeftRadius: 6 },
  offText: { color: C.primary, fontWeight: '700', fontSize: 11 },
  title: { fontSize: 14, lineHeight: 19, color: C.text },
  mystery: { color: C.primary, fontSize: 18, fontWeight: '600' },
  orig: { fontSize: 12, color: C.faint, textDecorationLine: 'line-through' },
  bar: { height: 18, borderRadius: 9, backgroundColor: '#FFD0D8', justifyContent: 'center', overflow: 'hidden' },
  barText: { color: '#fff', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  buy: { backgroundColor: C.primary, borderRadius: R.sm, paddingHorizontal: 14, paddingVertical: 7 },
  remind: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.primary },
  reminded: { backgroundColor: C.faint },
  buyText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
