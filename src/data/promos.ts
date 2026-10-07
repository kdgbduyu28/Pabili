import type Ionicons from '@expo/vector-icons/Ionicons';
import { PRODUCTS, Product, Shop, hash, rng, variantMultiplier } from './catalog';

// ---- Flash sale: a new batch of deals every 3 hours ----

export const SLOT_MS = 3 * 3600 * 1000;

export function slotStart(now: number, offset = 0): number {
  const d = new Date(now);
  d.setMinutes(0, 0, 0);
  d.setHours(Math.floor(d.getHours() / 3) * 3);
  return d.getTime() + offset * SLOT_MS;
}

export type FlashDeal = { product: Product; flashPrice: number; total: number; claimed: number };

const flashCache = new Map<number, FlashDeal[]>();

export function flashDeals(start: number): FlashDeal[] {
  const hit = flashCache.get(start);
  if (hit) return hit;
  const r = rng(hash(`flash:${start}`));
  const pool = PRODUCTS.slice();
  const deals: FlashDeal[] = [];
  while (deals.length < 16) {
    const [product] = pool.splice(Math.floor(r() * pool.length), 1);
    const flashPrice = Math.max(9, Math.round((product.originalPrice * (0.25 + r() * 0.3)) / 10) * 10 - 1);
    const total = 50 + Math.floor(r() * 250);
    deals.push({ product, flashPrice, total, claimed: Math.floor(total * (0.1 + r() * 0.85)) });
  }
  flashCache.set(start, deals);
  return deals;
}

export function activeFlash(productId: string, now: number): FlashDeal | undefined {
  return flashDeals(slotStart(now)).find((d) => d.product.id === productId);
}

/** How "sold out" a flash deal looks right now: creeps up as the slot runs. */
export function flashProgress(deal: FlashDeal, now: number): number {
  const elapsed = (now - slotStart(now)) / SLOT_MS;
  const base = deal.claimed / deal.total;
  return Math.min(0.98, base + (1 - base) * elapsed * 0.6);
}

// ---- Daily price drops: ~15% of products are cheaper today ----

export function dayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Percent off today, or 0. Changes at midnight, which is what makes cart prices "drop". */
export function dailyDrop(productId: string, now: number): number {
  const r = rng(hash(`drop:${dayKey(now)}:${productId}`));
  return r() < 0.15 ? 5 + Math.floor(r() * 16) : 0;
}

// ---- Mega sale days: 1.1, 2.2 … 12.12 ----

export type Mega = { label: string; start: number; end: number; live: boolean };

export function megaInfo(now: number): Mega {
  const d = new Date(now);
  for (let k = 0; k < 13; k++) {
    const m = (d.getMonth() + k) % 12;
    const y = d.getFullYear() + Math.floor((d.getMonth() + k) / 12);
    const start = new Date(y, m, m + 1).getTime();
    const end = start + 86400000;
    if (end > now) return { label: `${m + 1}.${m + 1}`, start, end, live: now >= start };
  }
  throw new Error('unreachable');
}

export const MEGA_EXTRA_PCT = 10;

const megaCache = new Map<number, Product[]>();

/** The 24 products that get an extra 10% off while a mega day is live. */
export function megaPicks(now: number): Product[] {
  const { start } = megaInfo(now);
  const hit = megaCache.get(start);
  if (hit) return hit;
  const r = rng(hash(`mega:${start}`));
  const pool = PRODUCTS.slice();
  const picks: Product[] = [];
  while (picks.length < 24) picks.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  megaCache.set(start, picks);
  return picks;
}

export function isMegaPick(productId: string, now: number) {
  return megaPicks(now).some((p) => p.id === productId);
}

// ---- Bundle deals: buy more of the same item, pay less each ----

export type BundleTier = { qty: number; pct: number };

export function bundleFor(p: Product): BundleTier[] | null {
  return hash(`bundle:${p.id}`) % 10 < 3 ? [{ qty: 2, pct: 5 }, { qty: 3, pct: 10 }] : null;
}

export function bundlePct(p: Product, qty: number): number {
  const tiers = bundleFor(p);
  if (!tiers) return 0;
  return tiers.filter((t) => qty >= t.qty).reduce((m, t) => Math.max(m, t.pct), 0);
}

// ---- Shop vouchers and free-shipping threshold ----

export const FREE_SHIP_MIN = 499;

export function shopVoucher(shop: Shop): { value: number; minSpend: number } {
  return shop.mall ? { value: 50, minSpend: 999 } : { value: 20, minSpend: 199 };
}

export function unitPrice(p: Product, variant: Record<string, string>, now: number) {
  const m = variantMultiplier(p, variant);
  const flash = activeFlash(p.id, now);
  const drop = dailyDrop(p.id, now);
  let base = p.price * (1 - drop / 100);
  if (flash) base = Math.min(base, flash.flashPrice);
  const mega = megaInfo(now).live && isMegaPick(p.id, now);
  if (mega) base *= 1 - MEGA_EXTRA_PCT / 100;
  return {
    price: Math.round(base * m),
    original: Math.round(p.originalPrice * m),
    flash: !!flash,
    drop,
    mega,
  };
}

// ---- Vouchers ----

export type Voucher = {
  id: string;
  title: string;
  subtitle: string;
  kind: 'fixed' | 'percent' | 'shipping';
  value: number;
  cap?: number;
  minSpend: number;
  /** Only claimable and usable while a mega day is live. */
  megaOnly?: boolean;
  /** Granted by the app (late parcel), not shown in the voucher center. */
  hidden?: boolean;
};

export const VOUCHERS: Voucher[] = [
  { id: 'WELCOME100', title: '₱100 off', subtitle: 'New Pabili user • Min. spend ₱300', kind: 'fixed', value: 100, minSpend: 300 },
  { id: 'FREESHIP', title: 'Free Shipping', subtitle: 'Up to ₱80 off shipping • No min. spend', kind: 'shipping', value: 80, minSpend: 0 },
  { id: 'PABILI15', title: '15% off', subtitle: 'Capped at ₱250 • Min. spend ₱999', kind: 'percent', value: 15, cap: 250, minSpend: 999 },
  { id: 'MEGADAY', title: '₱300 off', subtitle: 'Mega Day only • Min. spend ₱2,000', kind: 'fixed', value: 300, minSpend: 2000, megaOnly: true },
  { id: 'MEGASHIP', title: 'Free Shipping', subtitle: 'Mega Day only • Up to ₱150 off shipping', kind: 'shipping', value: 150, minSpend: 0, megaOnly: true },
  { id: 'LATE50', title: '₱50 off', subtitle: 'Sorry your parcel was late • No min. spend', kind: 'fixed', value: 50, minSpend: 0, hidden: true },
  { id: 'SHAKE30', title: '₱30 off', subtitle: 'Shake It prize • Min. spend ₱150', kind: 'fixed', value: 30, minSpend: 150, hidden: true },
  { id: 'SPIN10', title: '10% off', subtitle: 'Spin & Win prize • Capped at ₱100', kind: 'percent', value: 10, cap: 100, minSpend: 0, hidden: true },
  { id: 'LIVE30', title: '₱30 off', subtitle: 'Pabili Live exclusive • Min. spend ₱199', kind: 'fixed', value: 30, minSpend: 199, hidden: true },
  { id: 'COIN20', title: '₱20 off', subtitle: 'Coins Shop • Min. spend ₱99', kind: 'fixed', value: 20, minSpend: 99, hidden: true },
  { id: 'COIN15', title: '15% off', subtitle: 'Coins Shop • Capped at ₱150 • Min. spend ₱300', kind: 'percent', value: 15, cap: 150, minSpend: 300, hidden: true },
  { id: 'PAYDAY', title: '20% off', subtitle: 'Payday treat • Capped at ₱500 • Min. spend ₱1,500', kind: 'percent', value: 20, cap: 500, minSpend: 1500 },
];

export const getVoucher = (id: string | null | undefined) => VOUCHERS.find((v) => v.id === id);

// ---- Home banners ----

export type Banner = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
  href: string;
};

export const BANNERS: Banner[] = [
  { title: 'Mega Sale Day', subtitle: 'Up to 90% off. Spend ₱0 for real.', icon: 'bag-handle', colors: ['#F43F5E', '#FB7A3C'], href: '/mega' },
  { title: 'Free Shipping Daily', subtitle: 'Claim your voucher before it runs out', icon: 'car', colors: ['#0D9488', '#22D3EE'], href: '/vouchers' },
  { title: 'Pabili Mall', subtitle: '100% authentic. 100% imaginary.', icon: 'storefront', colors: ['#7C3AED', '#EC4899'], href: '/search?filter=mall' },
  { title: 'Payday Treat', subtitle: 'Treat yourself without the bill', icon: 'cash', colors: ['#F59E0B', '#EF4444'], href: '/vouchers' },
];
