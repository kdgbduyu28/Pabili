import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/bits';
import { Header, Wrap, back } from '../components/Page';
import { peso } from '../lib/format';
import { success, tap } from '../lib/haptics';
import { keptInWallet, useShop } from '../store/useShop';
import { toast } from '../store/useUi';
import { C, R } from '../theme';

const PRESETS: { name: string; amount: number }[] = [
  { name: 'Weekend trip', amount: 5000 },
  { name: 'Emergency fund', amount: 10000 },
  { name: 'New phone', amount: 30000 },
  { name: 'Tuition', amount: 50000 },
];

export default function Goal() {
  const goal = useShop((s) => s.goal);
  const kept = useShop((s) => keptInWallet(s.orders));
  const [name, setName] = useState(goal?.name ?? '');
  const [amount, setAmount] = useState(goal ? String(goal.amount) : '');

  const save = () => {
    const n = Number(amount);
    if (!name.trim() || !n) {
      toast('Add a name and an amount', 'alert-circle');
      return;
    }
    // A goal already reached by past orders still deserves its celebration.
    useShop.getState().setGoal({ name: name.trim(), amount: n });
    success();
    toast('Goal saved');
    back();
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Savings Goal" />
      <ScrollView keyboardShouldPersistTaps="handled">
        <Wrap style={{ maxWidth: 640, padding: 12, gap: 14 }}>
          <Text style={styles.note}>
            Every pretend order counts toward a real goal. Pabili has kept {peso(kept)} in your wallet so far. What is that money for?
          </Text>
          <View style={styles.presets}>
            {PRESETS.map((p) => (
              <Pressable
                key={p.name}
                onPress={() => {
                  tap();
                  setName(p.name);
                  setAmount(String(p.amount));
                }}
                style={[styles.preset, name === p.name && styles.presetOn]}
              >
                <Text style={[styles.presetName, name === p.name && { color: C.primary }]}>{p.name}</Text>
                <Text style={styles.presetAmount}>{peso(p.amount)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Saving for</Text>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. New phone" placeholderTextColor={C.faint} style={styles.input} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Target amount (₱)</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
              placeholder="30000"
              placeholderTextColor={C.faint}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
          <Button title="Save Goal" onPress={save} />
          {goal && (
            <Button
              title="Remove goal"
              variant="outline"
              onPress={() => {
                useShop.getState().setGoal(null);
                back();
              }}
            />
          )}
        </Wrap>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 13, color: C.muted, lineHeight: 19 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { flexGrow: 1, minWidth: 140, backgroundColor: C.card, borderRadius: R.md, padding: 12, borderWidth: 1, borderColor: C.card },
  presetOn: { borderColor: C.primary, backgroundColor: C.primarySoft },
  presetName: { fontSize: 14, fontWeight: '600', color: C.text },
  presetAmount: { fontSize: 12, color: C.muted, marginTop: 2 },
  field: { backgroundColor: C.card, borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 8 },
  label: { fontSize: 11, color: C.muted },
  input: { fontSize: 15, color: C.text, paddingVertical: 6 },
});
