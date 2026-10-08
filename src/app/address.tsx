import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/bits';
import { Header, Wrap, back } from '../components/Page';
import { success } from '../lib/haptics';
import { Address, DEFAULT_ADDRESS, useShop } from '../store/useShop';
import { toast } from '../store/useUi';
import { C, R, themed } from '../theme';

const FIELDS: { key: keyof Address; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Full Name', placeholder: 'Juan Dela Cruz' },
  { key: 'phone', label: 'Phone Number', placeholder: '(+63) 917 000 0000' },
  { key: 'line1', label: 'Street, Building, Barangay', placeholder: '123 Wishlist St.' },
  { key: 'city', label: 'City, Province', placeholder: 'Quezon City, Metro Manila' },
];

export default function AddressScreen() {
  const current = useShop((s) => s.address);
  const [form, setForm] = useState<Address>(current);

  const save = () => {
    const clean = Object.fromEntries(
      FIELDS.map((f) => [f.key, form[f.key].trim() || DEFAULT_ADDRESS[f.key]]),
    ) as Address;
    useShop.getState().setAddress(clean);
    success();
    toast('Address saved');
    back();
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="My Address" />
      <ScrollView keyboardShouldPersistTaps="handled">
        <Wrap style={{ maxWidth: 640, padding: 12, gap: 12 }}>
          <Text style={styles.note}>
            This is only used to make the checkout feel real. It stays on this device and nothing is ever shipped.
            Make one up if you like!
          </Text>
          {FIELDS.map((f) => (
            <View key={f.key} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                value={form[f.key]}
                onChangeText={(t) => setForm((x) => ({ ...x, [f.key]: t }))}
                placeholder={f.placeholder}
                placeholderTextColor={C.faint}
                style={styles.input}
              />
            </View>
          ))}
          <Button title="Save" onPress={save} />
        </Wrap>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => ({
  note: { fontSize: 12, color: C.muted, lineHeight: 18 },
  field: { backgroundColor: C.card, borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 8 },
  label: { fontSize: 11, color: C.muted },
  input: { fontSize: 15, color: C.text, paddingVertical: 6 },
}));
