import { StyleSheet } from 'react-native';

export type Scheme = 'light' | 'dark';

const shared = {
  primary: '#F43F5E',
  primaryDark: '#E11D48',
  accent: '#FB7A3C',
  grad: ['#F43F5E', '#FB7A3C'] as const,
  mall: '#BE123C',
  // Dark enough for white tag text (5:1).
  preferred: '#C2410C',
  ship: '#0D9488',
  star: '#FACC15',
  success: '#16A34A',
  coin: '#F59E0B',
  /** Text and icons sitting on brand-colored or photo backgrounds. */
  onColor: '#FFFFFF',
};

const light = {
  ...shared,
  primarySoft: '#FFF1F3',
  bg: '#F4F4F5',
  card: '#FFFFFF',
  /** Inputs, chips and other fills that sit on a card. */
  surface: '#F4F4F5',
  /** Rows nested inside a card (order items, checkout lines). */
  subtle: '#FAFAFA',
  text: '#1F2328',
  muted: '#71717A',
  // Secondary meta text (locations, struck-through prices); 3.7:1 on white.
  faint: '#85858F',
  line: '#ECECEE',
  shipBg: '#E6F7F5',
  coinSoft: '#FFF7E6',
  coinText: '#B45309',
  overlay: 'rgba(0,0,0,0.45)',
};

export type Palette = typeof light;

const dark: Palette = {
  ...shared,
  primarySoft: '#3B1820',
  bg: '#0E0E11',
  card: '#1A1A1F',
  surface: '#26262D',
  subtle: '#202026',
  text: '#F4F4F5',
  muted: '#A1A1AA',
  faint: '#71717A',
  line: '#2C2C33',
  shipBg: '#0F2E2B',
  coinSoft: '#2D2412',
  coinText: '#FBBF24',
  overlay: 'rgba(0,0,0,0.65)',
};

const PALETTES: Record<Scheme, Palette> = { light, dark };

let current: Scheme = 'light';

/**
 * Switch palettes. Call before rendering the tree for the new scheme; the root
 * layout keys the app on the scheme so every screen re-renders with it.
 */
export function setScheme(s: Scheme) {
  current = s;
}

export function getScheme(): Scheme {
  return current;
}

/** The active palette. Reads always return the current scheme's value. */
export const C: Palette = new Proxy(light, {
  get: (_, key) => PALETTES[current][key as keyof Palette],
}) as Palette;

/**
 * StyleSheet that is built once per scheme, on first use. Use in place of
 * StyleSheet.create so styles that reference `C` pick up dark mode.
 */
export function themed<T extends StyleSheet.NamedStyles<T>>(build: () => T): T {
  const cache: Partial<Record<Scheme, T>> = {};
  return new Proxy({} as T, {
    get: (_, key) => (cache[current] ??= StyleSheet.create(build()))[key as keyof T],
  });
}

export const R = { sm: 4, md: 8, lg: 12, xl: 16, pill: 999 };

export const MAX_WIDTH = 1200;
