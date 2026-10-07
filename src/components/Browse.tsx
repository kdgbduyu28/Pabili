import Ionicons from '@expo/vector-icons/Ionicons';
import { ReactNode, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Product, SHOPS, getShop } from '../data/catalog';
import { unitPrice } from '../data/promos';
import { tap } from '../lib/haptics';
import { C, R } from '../theme';
import { Button, EmptyState } from './bits';
import { Wrap } from './Page';
import { ProductGrid, SortBar, useSorted } from './ProductGrid';
import { Sheet } from './Sheet';

type Filters = {
  min: string;
  max: string;
  rating: number;
  locations: string[];
  mall: boolean;
  cod: boolean;
  freeShip: boolean;
};

const EMPTY: Filters = { min: '', max: '', rating: 0, locations: [], mall: false, cod: false, freeShip: false };
const LOCATIONS = [...new Set(SHOPS.map((s) => s.location))];

function countActive(f: Filters) {
  return (
    (f.min || f.max ? 1 : 0) + (f.rating ? 1 : 0) + (f.locations.length ? 1 : 0) + (f.mall ? 1 : 0) + (f.cod ? 1 : 0) + (f.freeShip ? 1 : 0)
  );
}

function applyFilters(xs: Product[], f: Filters): Product[] {
  const now = Date.now();
  const min = Number(f.min) || 0;
  const max = Number(f.max) || Infinity;
  return xs.filter((p) => {
    const price = unitPrice(p, {}, now).price;
    const shop = getShop(p.shopId);
    return (
      price >= min &&
      price <= max &&
      p.rating >= f.rating &&
      (!f.locations.length || f.locations.includes(shop.location)) &&
      (!f.mall || shop.mall) &&
      (!f.cod || p.cod) &&
      (!f.freeShip || p.freeShipping)
    );
  });
}

/** Sortable, filterable product listing shared by search, category and shop pages. */
export function Browse({ products, top, empty }: { products: Product[]; top?: ReactNode; empty?: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => applyFilters(products, filters), [products, filters]);
  const { sort, setSort, sorted } = useSorted(filtered);
  const active = countActive(filters);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView stickyHeaderIndices={top ? [1] : [0]} keyboardShouldPersistTaps="handled">
        {top ? <Wrap>{top}</Wrap> : null}
        <Wrap style={styles.bar}>
          <View style={{ flex: 1 }}>
            <SortBar sort={sort} onChange={setSort} />
          </View>
          <Pressable
            style={styles.filterBtn}
            onPress={() => {
              tap();
              setDraft(filters);
              setOpen(true);
            }}
          >
            <Ionicons name="funnel-outline" size={16} color={active ? C.primary : C.text} />
            <Text style={[styles.filterText, active > 0 && { color: C.primary }]}>Filter{active ? ` (${active})` : ''}</Text>
          </Pressable>
        </Wrap>
        <Wrap>
          {sorted.length ? (
            <>
              <Text style={styles.count}>{sorted.length} products</Text>
              <ProductGrid products={sorted} />
            </>
          ) : (
            (empty ?? (
              <EmptyState
                icon="search"
                title="No products found"
                subtitle={active ? 'Try loosening your filters.' : 'Try a different keyword.'}
                action={active ? <Button title="Clear filters" variant="outline" onPress={() => setFilters(EMPTY)} style={{ width: 180 }} /> : undefined}
              />
            ))
          )}
        </Wrap>
      </ScrollView>

      <Sheet open={open} onClose={() => setOpen(false)}>
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ padding: 16, gap: 18 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetTitle}>Search Filter</Text>

          <Group title="Price Range (₱)">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TextInput
                value={draft.min}
                onChangeText={(t) => setDraft((d) => ({ ...d, min: t.replace(/\D/g, '') }))}
                placeholder="MIN"
                placeholderTextColor={C.faint}
                keyboardType="number-pad"
                style={styles.input}
              />
              <View style={{ width: 12, height: 1, backgroundColor: C.faint }} />
              <TextInput
                value={draft.max}
                onChangeText={(t) => setDraft((d) => ({ ...d, max: t.replace(/\D/g, '') }))}
                placeholder="MAX"
                placeholderTextColor={C.faint}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </Group>

          <Group title="Rating">
            {[4.5, 4, 0].map((r) => (
              <Chip key={r} on={draft.rating === r} onPress={() => setDraft((d) => ({ ...d, rating: r }))}>
                {r ? `${r} stars & up` : 'Any'}
              </Chip>
            ))}
          </Group>

          <Group title="Ships From">
            {LOCATIONS.map((l) => {
              const on = draft.locations.includes(l);
              return (
                <Chip
                  key={l}
                  on={on}
                  onPress={() => setDraft((d) => ({ ...d, locations: on ? d.locations.filter((x) => x !== l) : [...d.locations, l] }))}
                >
                  {l}
                </Chip>
              );
            })}
          </Group>

          <Group title="Services & Promotions">
            <Chip on={draft.mall} onPress={() => setDraft((d) => ({ ...d, mall: !d.mall }))}>
              Pabili Mall
            </Chip>
            <Chip on={draft.freeShip} onPress={() => setDraft((d) => ({ ...d, freeShip: !d.freeShip }))}>
              Free Shipping
            </Chip>
            <Chip on={draft.cod} onPress={() => setDraft((d) => ({ ...d, cod: !d.cod }))}>
              Cash on Delivery
            </Chip>
          </Group>
        </ScrollView>
        <View style={styles.actions}>
          <Button title="Reset" variant="outline" style={{ flex: 1 }} onPress={() => setDraft(EMPTY)} />
          <Button
            title="Apply"
            style={{ flex: 1 }}
            onPress={() => {
              setFilters(draft);
              setOpen(false);
            }}
          />
        </View>
      </Sheet>
    </View>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
    </View>
  );
}

function Chip({ on, onPress, children }: { on: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.chip, on && styles.chipOn]}
    >
      <Text style={[styles.chipText, on && { color: C.primary }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: C.card },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  filterText: { fontSize: 13, color: C.text },
  count: { color: C.muted, fontSize: 12, paddingHorizontal: 12, paddingTop: 8 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  groupTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  input: { flex: 1, backgroundColor: '#F4F4F5', borderRadius: R.sm, paddingHorizontal: 12, height: 38, fontSize: 14, color: C.text, textAlign: 'center' },
  chip: { backgroundColor: '#F4F4F5', borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#F4F4F5' },
  chipOn: { backgroundColor: C.primarySoft, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.text },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 8 },
});
