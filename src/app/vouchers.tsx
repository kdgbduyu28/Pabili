import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/bits';
import { Header, Wrap } from '../components/Page';
import { VOUCHERS, megaInfo } from '../data/promos';
import { useNow } from '../lib/hooks';
import { success } from '../lib/haptics';
import { useShop } from '../store/useShop';
import { toast } from '../store/useUi';
import { C, R } from '../theme';

export default function Vouchers() {
  const claimed = useShop((s) => s.claimed);
  const used = useShop((s) => s.usedVouchers);
  const now = useNow(30_000);
  const live = megaInfo(now).live;
  // Prize and apology vouchers only show up once you've earned them.
  const shown = VOUCHERS.filter((v) => !v.hidden || claimed.includes(v.id));
  return (
    <View style={{ flex: 1 }}>
      <Header title="Voucher Center" cart />
      <ScrollView>
        <Wrap style={{ padding: 12, gap: 10 }}>
          {shown.map((v) => {
            const isClaimed = claimed.includes(v.id);
            const isUsed = !isClaimed && used.includes(v.id);
            return (
              <View key={v.id} style={[styles.voucher, isUsed && { opacity: 0.5 }]}>
                <View style={[styles.stub, v.kind === 'shipping' && { backgroundColor: C.ship }]}>
                  <Ionicons name={v.kind === 'shipping' ? 'car' : 'ticket'} size={28} color="#fff" />
                  <Text style={styles.stubText}>{v.kind === 'shipping' ? 'FREE SHIP' : 'PABILI'}</Text>
                </View>
                <View style={styles.notchTop} />
                <View style={styles.notchBottom} />
                <View style={{ flex: 1, padding: 12, gap: 3 }}>
                  <Text style={styles.title}>{v.title}</Text>
                  <Text style={styles.sub}>{v.subtitle}</Text>
                  <Text style={[styles.sub, { color: C.faint }]}>Code: {v.id}</Text>
                </View>
                <View style={{ justifyContent: 'center', paddingRight: 12 }}>
                  {isUsed ? (
                    <Text style={styles.sub}>Used</Text>
                  ) : v.megaOnly && !live ? (
                    <Button title="Mega Day" small variant="outline" onPress={() => router.push('/mega')} />
                  ) : isClaimed ? (
                    <Button title="Use" small variant="outline" onPress={() => router.navigate('/')} />
                  ) : (
                    <Button
                      title="Claim"
                      small
                      onPress={() => {
                        success();
                        useShop.getState().claimVoucher(v.id);
                        toast('Voucher claimed!', 'ticket');
                      }}
                    />
                  )}
                </View>
              </View>
            );
          })}
          <Text style={styles.foot}>Vouchers apply automatically at checkout. Each one can be used once per claim.</Text>
        </Wrap>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  voucher: { flexDirection: 'row', backgroundColor: C.card, borderRadius: R.sm, overflow: 'hidden', minHeight: 92 },
  stub: { width: 92, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', gap: 4 },
  stubText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  notchTop: { position: 'absolute', left: 84, top: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: C.bg },
  notchBottom: { position: 'absolute', left: 84, bottom: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: C.bg },
  title: { fontSize: 16, fontWeight: '700', color: C.text },
  sub: { fontSize: 12, color: C.muted },
  foot: { fontSize: 11, color: C.faint, textAlign: 'center', marginTop: 8 },
});
