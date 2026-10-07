import { PRODUCTS, Product, Shop, hash, rng, shuffled } from './catalog';
import { dailyDrop, dayKey, unitPrice } from './promos';

const HOUR = 3600_000;
const DAY = 24 * HOUR;

function startOfDay(now: number) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ---- Sold out, restock and pre-order ----

/** When a product that sold out today restocks (between 8 AM and 8 PM), or null if it never sold out. */
export function restockAt(p: Product, now: number): number | null {
  const h = hash(`so:${p.id}:${dayKey(now)}`);
  if (h % 14 !== 0) return null;
  return startOfDay(now) + (8 + ((h >>> 4) % 12)) * HOUR;
}

export function soldOut(p: Product, now: number): boolean {
  const at = restockAt(p, now);
  return at !== null && now < at;
}

export function isPreorder(p: Product): boolean {
  return hash(`pre:${p.id}`) % 15 === 1;
}

// ---- Price history ----

export type PricePoint = { at: number; price: number };

export function priceHistory(p: Product, now: number, days = 30): PricePoint[] {
  const today = startOfDay(now);
  return Array.from({ length: days }, (_, i) => {
    const at = today - (days - 1 - i) * DAY;
    const price = i === days - 1 ? unitPrice(p, {}, now).price : Math.round(p.price * (1 - dailyDrop(p.id, at + HOUR) / 100));
    return { at, price };
  });
}

// ---- Product Q&A ----

const QA_POOL: [q: string, a: string][] = [
  ['Original po ba ito?', 'Yes po, 100% authentic. Sealed pa pagdating.'],
  ['Ilang days po shipping to Cebu?', 'Usually 3–5 days po after ship out.'],
  ['May warranty po ba?', '7-day replacement warranty po for factory defects.'],
  ['Pwede po COD?', 'Opo, available ang COD for this item.'],
  ['Mabilis po ba mag-ship?', 'Ships within 24 hours po pag naka-order before 5 PM.'],
  ['Same as picture po ba?', 'Yes po, actual photo. Slight color difference lang due to lighting.'],
  ['May freebie po ba?', 'May free sticker po each order habang supplies last!'],
];
const ASKERS = ['m***a', 'j***y', 'p***o', 'k***e', 'r***n', 'a***s'];

export type QA = { id: string; q: string; a: string; by: string; daysAgo: number };

export function qaFor(p: Product): QA[] {
  const r = rng(hash(`qa:${p.id}`));
  const pool = QA_POOL.slice();
  return Array.from({ length: 3 }, (_, i) => {
    const [q, a] = pool.splice(Math.floor(r() * pool.length), 1)[0];
    return { id: `qa${i}`, q, a, by: ASKERS[Math.floor(r() * ASKERS.length)], daysAgo: 1 + Math.floor(r() * 40) };
  });
}

// ---- Group buy ----

export type GroupDeal = { product: Product; price: number; size: number; joined: number };

export function groupDeals(now: number): GroupDeal[] {
  const r = rng(hash(`group:${dayKey(now)}`));
  const pool = PRODUCTS.filter((p) => p.price >= 149);
  return Array.from({ length: 8 }, () => {
    const product = pool.splice(Math.floor(r() * pool.length), 1)[0];
    return {
      product,
      price: Math.max(9, Math.round((product.price * (0.45 + r() * 0.15)) / 10) * 10 - 1),
      size: r() < 0.6 ? 3 : 5,
      joined: 50 + Math.floor(r() * 2000),
    };
  });
}

export const GROUP_FRIENDS = ['Ate Joy', 'Kuya Mark', 'Bes Carla', 'Tropa Jem', 'Pinsan Rico', 'Ninang Liza', 'Mama Gina', 'Bunso Kiko'];

// ---- Feed clips ----

export type Scene = 'spin' | 'bounce' | 'float' | 'zoom';

export type Clip = {
  id: string;
  product: Product;
  creator: string;
  caption: string;
  likes: number;
  comments: number;
  scene: Scene;
  colors: [string, string];
};

const CREATORS = ['@haulqueen.ph', '@sulitfinds', '@techtito', '@glowwithmika', '@kusinanijun', '@ootd.bea', '@budolfinds', '@minimalistmanila'];
const CAPTIONS = [
  'Budol of the week. Grabe ang ganda in person 😍',
  'POV: you found it for less than ₱{price}',
  'Unboxing my new {name}. Worth it ba? YES.',
  'Run, don\'t walk. {name} is on sale',
  '3 reasons why I keep re-ordering this',
  'Rating this {name} 10/10, no notes',
  'Things I "bought" this payday (₱0 spent)',
  'This is your sign to add to cart',
];
const SCENES: Scene[] = ['spin', 'bounce', 'float', 'zoom'];
const CLIP_COLORS: [string, string][] = [
  ['#7C3AED', '#EC4899'],
  ['#0EA5E9', '#22D3EE'],
  ['#F43F5E', '#FB923C'],
  ['#059669', '#A3E635'],
  ['#1E293B', '#6366F1'],
  ['#DB2777', '#FBBF24'],
];

export const CLIPS: Clip[] = shuffled(777)
  .slice(0, 16)
  .map((product, i) => {
    const r = rng(hash(`clip:${i}`));
    const caption = CAPTIONS[Math.floor(r() * CAPTIONS.length)]
      .replace('{name}', product.name)
      .replace('{price}', String(Math.ceil(product.price / 100) * 100));
    return {
      id: `clip${i}`,
      product,
      creator: CREATORS[Math.floor(r() * CREATORS.length)],
      caption,
      likes: 200 + Math.floor(r() * r() * 90000),
      comments: 10 + Math.floor(r() * 900),
      scene: SCENES[i % SCENES.length],
      colors: CLIP_COLORS[i % CLIP_COLORS.length],
    };
  });

export const CLIP_COMMENTS = [
  'Saan po link? 😭',
  'Nag-checkout na ako agad',
  'Legit, may ganito ako!',
  'Budol talaga',
  'Ang cute!!!',
  'Add to cart na this',
  'Sana mag flash sale ulit',
  'Worth it po ba?',
  'Bought 2, no regrets',
];

// ---- Coins Shop ----

export type CoinItem =
  | { id: string; kind: 'voucher'; title: string; sub: string; cost: number; voucher: string; icon: 'ticket' | 'car' }
  | { id: string; kind: 'fertilizer'; title: string; sub: string; cost: number; icon: 'flask' };

export const COIN_ITEMS: CoinItem[] = [
  { id: 'v20', kind: 'voucher', title: '₱20 off voucher', sub: 'Min. spend ₱99', cost: 40, voucher: 'COIN20', icon: 'ticket' },
  { id: 'ship', kind: 'voucher', title: 'Free shipping voucher', sub: 'Up to ₱80 off shipping', cost: 60, voucher: 'FREESHIP', icon: 'car' },
  { id: 'v15', kind: 'voucher', title: '15% off voucher', sub: 'Capped at ₱150 • Min. spend ₱300', cost: 120, voucher: 'COIN15', icon: 'ticket' },
  { id: 'fert', kind: 'fertilizer', title: 'Garden fertilizer', sub: '+40 growth for your plant', cost: 15, icon: 'flask' },
];

export const PESO_DEAL_COST = 100;

/** Four products a day you can grab for ₱1 with coins. */
export function pesoDeals(now: number): Product[] {
  const r = rng(hash(`peso:${dayKey(now)}`));
  const pool = PRODUCTS.filter((p) => p.price <= 599);
  return Array.from({ length: 4 }, () => pool.splice(Math.floor(r() * pool.length), 1)[0]);
}

// ---- Gift wrap ----

export const WRAPS: { id: string; name: string; colors: [string, string]; ribbon: string }[] = [
  { id: 'classic', name: 'Classic Red', colors: ['#DC2626', '#F87171'], ribbon: '#FDE68A' },
  { id: 'floral', name: 'Floral Pink', colors: ['#F9A8D4', '#FBCFE8'], ribbon: '#BE185D' },
  { id: 'kraft', name: 'Kraft & Twine', colors: ['#B45309', '#D6A15F'], ribbon: '#FEF3C7' },
  { id: 'midnight', name: 'Midnight Gold', colors: ['#1E1B4B', '#4338CA'], ribbon: '#FACC15' },
];

export const getWrap = (id: string) => WRAPS.find((w) => w.id === id) ?? WRAPS[0];

// ---- Shop rating breakdown ----

export function ratingBreakdown(shop: Shop): number[] {
  const r = rng(hash(`rb:${shop.id}`));
  const five = 0.55 + (shop.rating - 4.5) * 0.8 + r() * 0.05;
  const four = (1 - five) * (0.6 + r() * 0.2);
  const rest = 1 - five - four;
  return [five, four, rest * 0.5, rest * 0.3, rest * 0.2].map((x) => Math.max(0, Math.round(x * 100)));
}

// ---- For You ----

/** Daily feed, nudged toward the categories you picked or keep looking at. */
export function forYou(seed: number, interests: string[], viewed: string[], likes: string[]): Product[] {
  const weight: Record<string, number> = {};
  for (const c of interests) weight[c] = (weight[c] ?? 0) + 3;
  for (const id of [...viewed, ...likes]) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (p) weight[p.categoryId] = (weight[p.categoryId] ?? 0) + 1;
  }
  const r = rng(seed);
  return shuffled(seed)
    .map((p) => ({ p, score: (weight[p.categoryId] ?? 0) + r() * 4 }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}
