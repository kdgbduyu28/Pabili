import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header, Wrap } from '../components/Page';
import { ACHIEVEMENTS } from '../lib/achievements';
import { dateTime } from '../lib/format';
import { useGrid } from '../lib/hooks';
import { useShop } from '../store/useShop';
import { C, R } from '../theme';

export default function Achievements() {
  const unlocked = useShop((s) => s.achievements);
  const { content } = useGrid();
  const cols = content < 500 ? 2 : content < 900 ? 3 : 4;
  const w = Math.floor((content - 24 - 10 * (cols - 1)) / cols);
  const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  const sorted = [...ACHIEVEMENTS].sort((a, b) => (unlocked[b.id] ? 1 : 0) - (unlocked[a.id] ? 1 : 0));

  return (
    <View style={{ flex: 1 }}>
      <Header title="Achievements" />
      <ScrollView>
        <Wrap>
          <View style={styles.summary}>
            <Ionicons name="trophy" size={34} color={C.coin} />
            <View style={{ flex: 1 }}>
              <Text style={styles.count}>
                {count} of {ACHIEVEMENTS.length} unlocked
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round((count / ACHIEVEMENTS.length) * 100)}%` }]} />
              </View>
            </View>
          </View>
          <View style={styles.grid}>
            {sorted.map((a) => {
              const at = unlocked[a.id];
              return (
                <View key={a.id} style={[styles.badge, { width: w }, !at && { opacity: 0.55 }]}>
                  <View style={[styles.medal, { backgroundColor: at ? a.color : '#E4E4E7' }]}>
                    <Ionicons name={at ? a.icon : 'lock-closed'} size={28} color="#fff" />
                  </View>
                  <Text style={styles.title} numberOfLines={1}>
                    {a.title}
                  </Text>
                  <Text style={styles.desc} numberOfLines={2}>
                    {a.desc}
                  </Text>
                  {at && <Text style={styles.date}>{dateTime(at)}</Text>}
                </View>
              );
            })}
          </View>
        </Wrap>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, padding: 16, marginBottom: 8 },
  count: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 6 },
  track: { height: 8, borderRadius: 4, backgroundColor: '#FEF3C7', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.coin },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12 },
  badge: { backgroundColor: C.card, borderRadius: R.lg, padding: 14, alignItems: 'center', gap: 6 },
  medal: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  title: { fontSize: 13, fontWeight: '800', color: C.text },
  desc: { fontSize: 11, color: C.muted, textAlign: 'center', minHeight: 28 },
  date: { fontSize: 10, color: C.faint },
});
