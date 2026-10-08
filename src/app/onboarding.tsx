import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/bits';
import { InterestPicker } from '../components/InterestPicker';
import { Wrap } from '../components/Page';
import { success } from '../lib/haptics';
import { useShop } from '../store/useShop';
import { C, themed } from '../theme';

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState<string[]>([]);

  const finish = (ids: string[]) => {
    useShop.getState().setInterests(ids);
    success();
    router.replace('/');
  };

  return (
    <LinearGradient colors={[C.primarySoft, C.bg]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 120 }}>
        <Wrap style={{ maxWidth: 560, paddingHorizontal: 20, gap: 8, alignItems: 'center' }}>
          <Text style={styles.brand}>Pabili</Text>
          <Text style={styles.title}>What do you love shopping for?</Text>
          <Text style={styles.sub}>Pick a few and your For You feed will lean their way. Everything here is pretend: shop all you want, pay ₱0.</Text>
          <View style={{ height: 16 }} />
          <InterestPicker value={picked} onChange={setPicked} />
        </Wrap>
      </ScrollView>
      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        <Wrap style={{ maxWidth: 560, gap: 8, paddingHorizontal: 20 }}>
          <Button title={picked.length ? `Start shopping (${picked.length})` : 'Pick at least one'} disabled={!picked.length} onPress={() => finish(picked)} />
          <Button title="Skip for now" variant="outline" onPress={() => finish([])} />
        </Wrap>
      </View>
    </LinearGradient>
  );
}

const styles = themed(() => ({
  brand: { color: C.primary, fontSize: 34, fontWeight: '900', fontStyle: 'italic' },
  title: { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center' },
  sub: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.card, paddingTop: 12 },
}));
