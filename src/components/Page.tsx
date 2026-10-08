import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { LayoutChangeEvent, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, MAX_WIDTH, themed } from '../theme';
import { CartButton } from './CartButton';

/** Centers content and caps its width so desktop web doesn't stretch edge to edge. */
export function Wrap({ children, style, onLayout }: { children: ReactNode; style?: StyleProp<ViewStyle>; onLayout?: (e: LayoutChangeEvent) => void }) {
  return (
    <View style={[styles.wrap, style]} onLayout={onLayout}>
      {children}
    </View>
  );
}

export function back() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Simple white header used by stack screens. */
export function Header({ title, right, cart }: { title: string; right?: ReactNode; cart?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Wrap style={styles.headerRow}>
        <Pressable onPress={back} hitSlop={10} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={C.primary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {right}
        {cart && <CartButton color={C.primary} />}
      </Wrap>
    </View>
  );
}

/** Gradient header with a search pill, like the home feed. */
export function SearchHeader({ placeholder, showBack }: { placeholder?: string; showBack?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingTop: insets.top }}>
      <Wrap style={styles.searchRow}>
        {showBack && (
          <Pressable onPress={back} hitSlop={10} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
        )}
        <Pressable style={styles.searchPill} onPress={() => router.push('/search')}>
          <Ionicons name="search" size={18} color={C.primary} />
          <Text style={styles.searchText} numberOfLines={1}>
            {placeholder ?? 'Search Pabili'}
          </Text>
        </Pressable>
        <CartButton />
      </Wrap>
    </LinearGradient>
  );
}

const styles = themed(() => ({
  wrap: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  header: { backgroundColor: C.card, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  headerRow: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 12, gap: 12 },
  backBtn: { padding: 2 },
  title: { flex: 1, fontSize: 18, fontWeight: '600', color: C.text },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 12, paddingVertical: 8 },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 38,
  },
  searchText: { color: C.primary, fontSize: 14, flex: 1, opacity: 0.85 },
}));
