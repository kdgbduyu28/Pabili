import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '../components/bits';
import { InterestPicker } from '../components/InterestPicker';
import { Header, Wrap } from '../components/Page';
import { tap, warn } from '../lib/haptics';
import { NOTIFICATIONS_SUPPORTED, permission } from '../lib/push';
import { play } from '../lib/sound';
import { ThemePref, useShop } from '../store/useShop';
import { toast } from '../store/useUi';
import { C, R, themed } from '../theme';

const COOL_OFF_OPTIONS = [5, 10, 30, 60];

const THEMES: { id: ThemePref; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { id: 'light', label: 'Light', icon: 'sunny-outline' },
  { id: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function Settings() {
  const settings = useShop((s) => s.settings);
  const interests = useShop((s) => s.interests) ?? [];
  const [picked, setPicked] = useState(interests);
  const { setSettings } = useShop.getState();

  const reset = () => {
    const doIt = () => {
      useShop.getState().resetAll();
      toast('Fresh start!', 'refresh-circle');
    };
    warn();
    if (Platform.OS === 'web') {
      if (window.confirm('Clear your cart, orders, likes, coins and achievements?')) doIt();
    } else {
      Alert.alert('Reset everything?', 'Clears your cart, orders, likes, coins and achievements.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: doIt },
      ]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Settings" />
      <ScrollView keyboardShouldPersistTaps="handled">
        <Wrap style={{ maxWidth: 720 }}>
          <View style={[styles.card, { padding: 14, gap: 10 }]}>
            <Text style={styles.title}>Appearance</Text>
            <View style={styles.segments}>
              {THEMES.map((t) => {
                const on = settings.theme === t.id || (!settings.theme && t.id === 'system');
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => {
                      tap();
                      setSettings({ theme: t.id });
                    }}
                    style={[styles.segment, on && styles.segmentOn]}
                  >
                    <Ionicons name={t.icon} size={16} color={on ? C.primary : C.muted} />
                    <Text style={[styles.optionText, on && { color: C.primary, fontWeight: '700' }]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Row title="Sound effects" sub="Cha-ching on checkout, coin clinks, box pops">
              <Switch
                value={settings.sound}
                onValueChange={(sound) => {
                  setSettings({ sound });
                  if (sound) play('coin');
                }}
                trackColor={{ true: C.primary, false: '#D4D4D8' }}
                thumbColor="#fff"
              />
            </Row>
            <Row
              title="Notifications"
              sub={
                NOTIFICATIONS_SUPPORTED
                  ? 'Parcel arrivals, restocks, group buys and a daily coin reminder'
                  : 'Available in the iPhone and Android apps'
              }
            >
              <Switch
                value={NOTIFICATIONS_SUPPORTED && settings.notifications !== false}
                disabled={!NOTIFICATIONS_SUPPORTED}
                onValueChange={async (notifications) => {
                  tap();
                  setSettings({ notifications });
                  if (notifications && !(await permission(true))) {
                    toast('Turn on notifications for Pabili in your phone settings', 'notifications-off');
                  }
                }}
                trackColor={{ true: C.primary, false: '#D4D4D8' }}
                thumbColor="#fff"
              />
            </Row>
            <Row title="Cool-off mode" sub="Items must sit in your cart for a while before you can check out. Wait it out to earn a patience bonus.">
              <Switch
                value={settings.coolOff}
                onValueChange={(coolOff) => {
                  tap();
                  setSettings({ coolOff });
                }}
                trackColor={{ true: C.primary, false: '#D4D4D8' }}
                thumbColor="#fff"
              />
            </Row>
            {settings.coolOff && (
              <View style={styles.options}>
                {COOL_OFF_OPTIONS.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => {
                      tap();
                      setSettings({ coolOffMins: m });
                    }}
                    style={[styles.option, settings.coolOffMins === m && styles.optionOn]}
                  >
                    <Text style={[styles.optionText, settings.coolOffMins === m && { color: C.primary }]}>{m < 60 ? `${m} min` : '1 hour'}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.card, { padding: 14, gap: 12 }]}>
            <Text style={styles.title}>My interests</Text>
            <Text style={styles.sub}>Your For You feed on Home leans toward these.</Text>
            <InterestPicker value={picked} onChange={setPicked} />
            <Button
              title="Save interests"
              onPress={() => {
                useShop.getState().setInterests(picked);
                toast('Interests saved');
              }}
            />
          </View>

          <View style={[styles.card, { padding: 14 }]}>
            <Button title="Reset all data" variant="outline" icon="refresh-outline" onPress={reset} />
          </View>
        </Wrap>
      </ScrollView>
    </View>
  );
}

function Row({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = themed(() => ({
  card: { backgroundColor: C.card, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  title: { fontSize: 14, fontWeight: '600', color: C.text },
  sub: { fontSize: 12, color: C.muted, lineHeight: 17 },
  options: { flexDirection: 'row', gap: 8, padding: 14 },
  segments: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingVertical: 10 },
  segmentOn: { borderColor: C.primary, backgroundColor: C.primarySoft },
  option: { borderWidth: 1, borderColor: C.line, borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 6 },
  optionOn: { borderColor: C.primary, backgroundColor: C.primarySoft },
  optionText: { fontSize: 13, color: C.text },
}));
