import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Product, getShop } from '../data/catalog';
import { isPreorder, soldOut } from '../data/extras';
import { unitPrice } from '../data/promos';
import { soldLabel } from '../lib/format';
import { C, R, themed } from '../theme';
import { Price, Tag } from './bits';
import { ProductImage } from './ProductImage';

type Props = { product: Product; width: number; now: number };

export const ProductCard = memo(function ProductCard({ product: p, width, now }: Props) {
  const shop = getShop(p.shopId);
  const { price, flash, drop, mega } = unitPrice(p, {}, now);
  const pct = Math.round((1 - price / p.originalPrice) * 100);
  return (
    <Pressable
      onPress={() => router.push(`/product/${p.id}`)}
      style={({ pressed }) => [styles.card, { width }, pressed && { opacity: 0.85 }]}
    >
      <ProductImage emoji={p.emoji} gradient={p.gradient} size={width} />
      {soldOut(p, now) && (
        <View style={[styles.soldOut, { width, height: width }]}>
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        </View>
      )}
      {pct > 0 && (
        <View style={styles.discount}>
          <Text style={styles.discountText}>-{pct}%</Text>
        </View>
      )}
      {flash && (
        <View style={styles.flashTag}>
          <Ionicons name="flash" size={10} color="#fff" />
          <Text style={styles.flashText}>FLASH</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>
          {shop.mall || shop.preferred ? (
            <Text style={[styles.inlineTag, { backgroundColor: shop.mall ? C.mall : C.preferred }]}>
              {shop.mall ? ' Mall ' : ' Preferred '}
            </Text>
          ) : null}
          {shop.mall || shop.preferred ? ' ' : ''}
          {p.title}
        </Text>
        <View style={styles.badges}>
          {p.freeShipping && <Tag text="Free Shipping" color={C.ship} bg={C.shipBg} />}
          {p.cod && <Tag text="COD" color={C.primary} border={C.primary} />}
          {isPreorder(p) && <Tag text="Pre-order" color={C.muted} border={C.faint} />}
          {mega ? (
            <Tag text="Mega" color="#fff" bg={C.primary} />
          ) : (
            drop > 0 && !flash && <Tag text="Price drop" color="#fff" bg={C.success} />
          )}
        </View>
        <View style={styles.bottom}>
          <Price value={price} size={16} />
          <Text style={styles.sold}>{soldLabel(p.sold)}</Text>
        </View>
        <Text style={styles.loc} numberOfLines={1}>
          {shop.location}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = themed(() => ({
  card: { backgroundColor: C.card, borderRadius: R.sm, overflow: 'hidden' },
  discount: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFE5E9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomLeftRadius: R.md,
  },
  discountText: { color: C.primary, fontSize: 12, fontWeight: '700' },
  flashTag: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    top: 6,
    left: 0,
    backgroundColor: C.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopRightRadius: R.sm,
    borderBottomRightRadius: R.sm,
  },
  flashText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  soldOut: { position: 'absolute', top: 0, left: 0, backgroundColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center' },
  soldOutBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  soldOutText: { color: '#fff', fontWeight: '900', fontSize: 11 },
  body: { padding: 8, gap: 4 },
  title: { fontSize: 13, lineHeight: 17, color: C.text, minHeight: 34 },
  inlineTag: { color: '#fff', fontSize: 10, fontWeight: '700' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, minHeight: 16, overflow: 'hidden', maxHeight: 16 },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 },
  sold: { fontSize: 11, color: C.muted, marginBottom: 2 },
  loc: { fontSize: 11, color: C.faint },
}));
