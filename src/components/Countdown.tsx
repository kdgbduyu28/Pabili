import { StyleSheet, Text, View } from 'react-native';
import { countdownParts } from '../lib/format';
import { C, themed } from '../theme';

export function Countdown({ ms, dark = true }: { ms: number; dark?: boolean }) {
  const parts = countdownParts(ms);
  return (
    <View style={styles.row}>
      {parts.map((p, i) => (
        <View key={i} style={styles.row}>
          {i > 0 && <Text style={[styles.colon, !dark && { color: '#fff' }]}>:</Text>}
          <View style={[styles.box, !dark && { backgroundColor: '#fff' }]}>
            <Text style={[styles.digit, !dark && { color: '#111' }]}>{p}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = themed(() => ({
  row: { flexDirection: 'row', alignItems: 'center' },
  box: { backgroundColor: '#111', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, minWidth: 22, alignItems: 'center' },
  digit: { color: '#fff', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  colon: { fontWeight: '800', marginHorizontal: 2, color: C.text },
}));
