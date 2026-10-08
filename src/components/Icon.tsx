import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { Shop } from '../data/catalog';
import { C, themed } from '../theme';

export type IconName = keyof typeof Ionicons.glyphMap;

/** Pabili Coin: a drawn coin, so it looks the same on every platform. */
export function Coin({ size = 18 }: { size?: number }) {
  return (
    <View
      style={[
        styles.coin,
        { width: size, height: size, borderRadius: size / 2, borderWidth: Math.max(1, size / 10) },
      ]}
    >
      <Text style={[styles.coinText, { fontSize: size * 0.58, lineHeight: size * 0.8 }]} allowFontScaling={false}>
        P
      </Text>
    </View>
  );
}

// All dark enough for white initials.
const SHOP_COLORS = ['#E11D48', '#C2410C', '#0F766E', '#7C3AED', '#2563EB', '#DB2777', '#A16207', '#15803D'];

/** Shop logo: initials on a color picked from the shop id. */
export function ShopAvatar({ shop, size = 52 }: { shop: Shop; size?: number }) {
  const initials = shop.name
    .split(/[\s-]+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const color = SHOP_COLORS[Number(shop.id.slice(1)) % SHOP_COLORS.length];
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }} allowFontScaling={false}>
        {initials}
      </Text>
      {shop.mall && (
        <View style={styles.mallDot}>
          <Ionicons name="checkmark" size={size * 0.22} color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = themed(() => ({
  coin: { backgroundColor: '#FBBF24', borderColor: '#D97706', alignItems: 'center', justifyContent: 'center' },
  coinText: { color: '#92400E', fontWeight: '900', textAlign: 'center' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  mallDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: C.mall,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#fff',
    padding: 1,
  },
}));
