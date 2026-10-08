import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { ActivityIndicator, GestureResponderEvent, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Shop } from '../data/catalog';
import { peso } from '../lib/format';
import { tap } from '../lib/haptics';
import { C, R, themed } from '../theme';

export function ShopTag({ shop, style }: { shop: Shop; style?: StyleProp<ViewStyle> }) {
  if (shop.mall) return <Tag text="Mall" color="#fff" bg={C.mall} style={style} />;
  if (shop.preferred) return <Tag text="Preferred" color="#fff" bg={C.preferred} style={style} />;
  return null;
}

export function Tag({
  text,
  color,
  bg,
  border,
  style,
}: {
  text: string;
  color: string;
  bg?: string;
  border?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: bg ?? 'transparent', borderColor: border ?? bg ?? 'transparent' },
        style,
      ]}
    >
      <Text style={[styles.tagText, { color }]}>{text}</Text>
    </View>
  );
}

export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={rating >= i ? 'star' : rating >= i - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={C.star}
        />
      ))}
    </View>
  );
}

export function Price({
  value,
  size = 16,
  color = C.primary,
  style,
}: {
  value: number;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  const s = peso(value);
  return (
    <Text style={[{ color, fontWeight: '600' }, style]}>
      <Text style={{ fontSize: size * 0.7 }}>₱</Text>
      <Text style={{ fontSize: size }}>{s.replace('₱', '')}</Text>
    </Text>
  );
}

export function Checkbox({ checked, onPress, size = 20 }: { checked: boolean; onPress: () => void; size?: number }) {
  return (
    <Pressable
      hitSlop={10}
      onPress={() => {
        tap();
        onPress();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[
        styles.check,
        { width: size, height: size, borderRadius: size / 2 },
        checked && { backgroundColor: C.primary, borderColor: C.primary },
      ]}
    >
      {checked && <Ionicons name="checkmark" size={size * 0.75} color="#fff" />}
    </Pressable>
  );
}

export function QtyStepper({ value, onChange, max = 999 }: { value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <View style={styles.stepper}>
      <Pressable
        style={styles.stepBtn}
        disabled={value <= 1}
        onPress={() => {
          tap();
          onChange(value - 1);
        }}
      >
        <Ionicons name="remove" size={16} color={value <= 1 ? C.faint : C.text} />
      </Pressable>
      <Text style={styles.stepVal}>{value}</Text>
      <Pressable
        style={styles.stepBtn}
        disabled={value >= max}
        onPress={() => {
          tap();
          onChange(value + 1);
        }}
      >
        <Ionicons name="add" size={16} color={value >= max ? C.faint : C.text} />
      </Pressable>
    </View>
  );
}

type ButtonProps = {
  title: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: 'primary' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function Button({ title, onPress, variant = 'primary', disabled, loading, style, small, icon }: ButtonProps) {
  const inner = (
    <View style={[styles.btnInner, small && styles.btnSmall]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : C.primary} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 14 : 18} color={variant === 'primary' ? '#fff' : C.primary} />}
          <Text
            style={[
              styles.btnText,
              small && { fontSize: 13 },
              { color: variant === 'primary' ? '#fff' : C.primary },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        variant === 'outline' && styles.btnOutline,
        (disabled || pressed) && { opacity: disabled ? 0.45 : 0.85 },
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient colors={C.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnGrad}>
          {inner}
        </LinearGradient>
      ) : (
        inner
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({
  icon,
  title,
  value,
  onPress,
  valueColor,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
  onPress?: () => void;
  valueColor?: string;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      {icon && <Ionicons name={icon} size={20} color={C.primary} style={{ marginRight: 10 }} />}
      <Text style={styles.rowTitle}>{title}</Text>
      {value ? (
        <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {onPress && <Ionicons name="chevron-forward" size={16} color={C.faint} />}
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={44} color={C.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
      {action}
    </View>
  );
}

export function SectionTitle({ title, right, onPress }: { title: string; right?: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionText}>{title}</Text>
      {right && (
        <Pressable onPress={onPress} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: C.muted, fontSize: 13 }}>{right}</Text>
          <Ionicons name="chevron-forward" size={14} color={C.muted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = themed(() => ({
  tag: { borderRadius: 2, paddingHorizontal: 4, paddingVertical: 1, borderWidth: StyleSheet.hairlineWidth, alignSelf: 'flex-start' },
  tagText: { fontSize: 10, fontWeight: '700' },
  check: { borderWidth: 1.5, borderColor: '#C4C4CC', alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  stepper: { flexDirection: 'row', borderWidth: 1, borderColor: C.line, borderRadius: R.sm, alignItems: 'center' },
  stepBtn: { width: 30, height: 28, alignItems: 'center', justifyContent: 'center' },
  stepVal: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: 14,
    color: C.text,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: C.line,
    lineHeight: 28,
  },
  btn: { borderRadius: R.sm, overflow: 'hidden' },
  btnOutline: { borderWidth: 1, borderColor: C.primary, backgroundColor: C.card },
  btnGrad: { borderRadius: R.sm },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16, minHeight: 44 },
  btnSmall: { minHeight: 32, paddingHorizontal: 12 },
  btnText: { fontSize: 15, fontWeight: '600' },
  card: { backgroundColor: C.card, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, backgroundColor: C.card },
  rowTitle: { flex: 1, fontSize: 14, color: C.text },
  rowValue: { fontSize: 13, color: C.muted, marginRight: 4, maxWidth: '55%' },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.text, textAlign: 'center' },
  emptySub: { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 8 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12 },
  sectionText: { fontSize: 15, fontWeight: '700', color: C.text, letterSpacing: 0.3 },
}));
