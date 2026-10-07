import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES } from '../data/catalog';
import { tap } from '../lib/haptics';
import { C, R } from '../theme';

export function InterestPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((c) => {
        const on = value.includes(c.id);
        return (
          <Pressable
            key={c.id}
            onPress={() => {
              tap();
              onChange(on ? value.filter((x) => x !== c.id) : [...value, c.id]);
            }}
            style={[styles.item, on && styles.itemOn]}
          >
            <Ionicons name={c.icon} size={26} color={on ? '#fff' : C.primary} />
            <Text style={[styles.label, on && { color: '#fff' }]} numberOfLines={2}>
              {c.name}
            </Text>
            {on && <Ionicons name="checkmark-circle" size={16} color="#fff" style={styles.check} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  item: { width: 100, height: 96, borderRadius: R.lg, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 },
  itemOn: { backgroundColor: C.primary },
  label: { fontSize: 11, color: C.text, textAlign: 'center' },
  check: { position: 'absolute', top: 6, right: 6 },
});
