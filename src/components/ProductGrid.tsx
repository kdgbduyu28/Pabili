import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Product } from '../data/catalog';
import { unitPrice } from '../data/promos';
import { GRID_GAP, GRID_PAD, gridFor, useMeasuredWidth, useNow } from '../lib/hooks';
import { C, themed } from '../theme';
import { ProductCard } from './ProductCard';

/** Plain wrapped grid. Lives inside a parent ScrollView so it can sit under other sections. */
export function ProductGrid({ products, keyPrefix = '' }: { products: Product[]; keyPrefix?: string }) {
  const { width, onLayout } = useMeasuredWidth();
  const { cardWidth } = gridFor(width);
  const now = useNow(30_000);
  return (
    <View style={styles.grid} onLayout={onLayout}>
      {products.map((p, i) => (
        <ProductCard key={`${keyPrefix}${p.id}-${i}`} product={p} width={cardWidth} now={now} />
      ))}
    </View>
  );
}

export type Sort = 'relevance' | 'latest' | 'sales' | 'price_asc' | 'price_desc';

export function sortProducts(xs: Product[], sort: Sort, now = Date.now()): Product[] {
  const price = (p: Product) => unitPrice(p, {}, now).price;
  const out = xs.slice();
  if (sort === 'latest') out.sort((a, b) => a.listedDaysAgo - b.listedDaysAgo);
  if (sort === 'sales') out.sort((a, b) => b.sold - a.sold);
  if (sort === 'price_asc') out.sort((a, b) => price(a) - price(b));
  if (sort === 'price_desc') out.sort((a, b) => price(b) - price(a));
  return out;
}

export function SortBar({ sort, onChange }: { sort: Sort; onChange: (s: Sort) => void }) {
  const tabs: { id: Sort | 'price'; label: string }[] = [
    { id: 'relevance', label: 'Relevance' },
    { id: 'latest', label: 'Latest' },
    { id: 'sales', label: 'Top Sales' },
    { id: 'price', label: sort === 'price_desc' ? 'Price ↓' : 'Price ↑' },
  ];
  return (
    <View style={styles.sortBar}>
      {tabs.map((t) => {
        const active = t.id === 'price' ? sort.startsWith('price') : sort === t.id;
        return (
          <Pressable
            key={t.id}
            style={[styles.sortTab, active && styles.sortActive]}
            onPress={() => {
              if (t.id === 'price') onChange(sort === 'price_asc' ? 'price_desc' : 'price_asc');
              else onChange(t.id);
            }}
          >
            <Text style={[styles.sortText, active && { color: C.primary, fontWeight: '600' }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function useSorted(products: Product[]) {
  const [sort, setSort] = useState<Sort>('relevance');
  const sorted = useMemo(() => sortProducts(products, sort), [products, sort]);
  return { sort, setSort, sorted };
}

const styles = themed(() => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, padding: GRID_PAD },
  sortBar: { flexDirection: 'row', backgroundColor: C.card, borderBottomWidth: 1, borderColor: C.line },
  sortTab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderColor: 'transparent' },
  sortActive: { borderColor: C.primary },
  sortText: { fontSize: 13, color: C.text },
}));
