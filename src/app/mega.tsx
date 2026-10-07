import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, SectionTitle } from '../components/bits';
import { CartButton } from '../components/CartButton';
import { Countdown } from '../components/Countdown';
import { IconName } from '../components/Icon';
import { Wrap, back } from '../components/Page';
import { ProductGrid } from '../components/ProductGrid';
import { MEGA_EXTRA_PCT, VOUCHERS, megaInfo, megaPicks } from '../data/promos';
import { success, tap } from '../lib/haptics';
import { useNow } from '../lib/hooks';
import { useShop } from '../store/useShop';
import { toast } from '../store/useUi';
import { C, R } from '../theme';

const PERKS: { icon: IconName; title: string; sub: string }[] = [
  { icon: 'car', title: 'Free shipping', sub: 'On every order, every shop' },
  { icon: 'pricetags', title: `Extra ${MEGA_EXTRA_PCT}% off`, sub: 'On 24 Mega Picks' },
  { icon: 'sparkles', title: '2x coins', sub: 'Double Pabili Coins per order' },
  { icon: 'ticket', title: 'Mega vouchers', sub: 'Drop at 12:00 AM' },
];

export default function Mega() {
  const insets = useSafeAreaInsets();
  const now = useNow();
  const mega = megaInfo(now);
  const picks = megaPicks(now);
  const claimed = useShop((s) => s.claimed);
  const [reminded, setReminded] = useState(false);
  const megaVouchers = VOUCHERS.filter((v) => v.megaOnly);
  const remaining = mega.live ? mega.end - now : mega.start - now;
  const days = Math.floor(remaining / 86400000);

  return (
    <ScrollView>
      <LinearGradient colors={['#7C3AED', '#F43F5E', '#FB7A3C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top }}>
        <Wrap style={styles.top}>
          <Pressable onPress={back} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }} />
          <CartButton />
        </Wrap>
        <Wrap style={styles.hero}>
          <Text style={styles.label}>{mega.label}</Text>
          <Text style={styles.heroTitle}>MEGA SALE</Text>
          <View style={styles.statusPill}>
            <View style={[styles.liveDot, !mega.live && { backgroundColor: '#FDE68A' }]} />
            <Text style={styles.statusText}>{mega.live ? 'LIVE NOW · ends in' : 'Starts in'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            {days > 0 && (
              <View style={styles.dayBox}>
                <Text style={styles.dayText}>{days}d</Text>
              </View>
            )}
            <Countdown ms={remaining % 86400000} dark={false} />
          </View>
        </Wrap>
      </LinearGradient>

      <Wrap>
        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.title} style={styles.perk}>
              <View style={styles.perkIcon}>
                <Ionicons name={p.icon} size={20} color={C.primary} />
              </View>
              <Text style={styles.perkTitle}>{p.title}</Text>
              <Text style={styles.perkSub}>{p.sub}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <SectionTitle title="MEGA VOUCHERS" />
          <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 10 }}>
            {megaVouchers.map((v) => {
              const has = claimed.includes(v.id);
              return (
                <View key={v.id} style={styles.voucher}>
                  <Ionicons name={v.kind === 'shipping' ? 'car' : 'ticket'} size={26} color={C.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', color: C.text, fontSize: 16 }}>{v.title}</Text>
                    <Text style={{ color: C.muted, fontSize: 12 }}>{v.subtitle}</Text>
                  </View>
                  {mega.live ? (
                    <Button
                      title={has ? 'Claimed' : 'Claim'}
                      small
                      disabled={has}
                      onPress={() => {
                        success();
                        useShop.getState().claimVoucher(v.id);
                        toast('Mega voucher claimed!', 'ticket');
                      }}
                    />
                  ) : (
                    <Text style={styles.drops}>Drops 12:00 AM</Text>
                  )}
                </View>
              );
            })}
            {!mega.live && (
              <Button
                title={reminded ? 'Reminder set' : `Remind me when ${mega.label} starts`}
                variant="outline"
                icon="alarm-outline"
                disabled={reminded}
                onPress={() => {
                  tap();
                  setReminded(true);
                  toast("We'll pretend to wake you at midnight", 'alarm');
                }}
              />
            )}
          </View>
        </View>

        <View style={styles.picksHead}>
          <Text style={styles.picksTitle}>MEGA PICKS</Text>
          <Text style={styles.picksSub}>{mega.live ? `Extra ${MEGA_EXTRA_PCT}% off already applied` : `Add to cart now. Extra ${MEGA_EXTRA_PCT}% off on ${mega.label}`}</Text>
        </View>
        <ProductGrid products={picks} keyPrefix="mega" />
      </Wrap>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 14 },
  hero: { alignItems: 'center', paddingBottom: 28, paddingTop: 4 },
  label: { color: '#fff', fontSize: 64, fontWeight: '900', fontStyle: 'italic', letterSpacing: -2, lineHeight: 70 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 6 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 4, marginTop: 14 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dayBox: { backgroundColor: '#fff', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  dayText: { color: '#111', fontWeight: '700', fontSize: 12 },
  perks: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: C.card, marginBottom: 8, paddingVertical: 12 },
  perk: { width: '25%', minWidth: 80, flexGrow: 1, alignItems: 'center', gap: 4, paddingHorizontal: 4, paddingVertical: 6 },
  perkIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  perkTitle: { fontSize: 12, fontWeight: '700', color: C.text, textAlign: 'center' },
  perkSub: { fontSize: 10, color: C.muted, textAlign: 'center' },
  card: { backgroundColor: C.card, marginBottom: 8 },
  voucher: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#FBCFE8', backgroundColor: '#FFF5F7', borderRadius: R.md, padding: 12 },
  drops: { fontSize: 11, fontWeight: '700', color: C.preferred },
  picksHead: { backgroundColor: C.card, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 3, borderColor: C.primary },
  picksTitle: { color: C.primary, fontWeight: '900', letterSpacing: 1 },
  picksSub: { color: C.muted, fontSize: 12, marginTop: 2 },
});
