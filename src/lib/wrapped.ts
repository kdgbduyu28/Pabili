import { Category, Product, getCategory, getProduct, getShop } from '../data/catalog';
import type { IconName } from '../components/Icon';
import { useShop } from '../store/useShop';

type S = ReturnType<typeof useShop.getState>;

export type Persona = { title: string; desc: string; icon: IconName };

export type Wrapped = {
  label: string;
  orders: number;
  items: number;
  kept: number;
  saved: number;
  coins: number;
  reviews: number;
  resisted: number;
  resistedCount: number;
  topCategory: { category: Category; count: number } | null;
  topShop: { name: string; count: number } | null;
  priciest: { product: Product; price: number } | null;
  achievements: number;
  persona: Persona;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const BY_CATEGORY: Record<string, Persona> = {
  gadgets: { title: 'The Tech Tito', desc: 'Chargers, earbuds, gadgets. You know the specs by heart.', icon: 'hardware-chip' },
  computers: { title: 'The Setup Builder', desc: 'Your pretend desk setup is immaculate.', icon: 'desktop' },
  beauty: { title: 'The Glow Getter', desc: 'Ten-step routine, zero pesos spent.', icon: 'sparkles' },
  food: { title: 'The Pantry Boss', desc: 'Your pretend pantry could survive a typhoon season.', icon: 'restaurant' },
  women: { title: 'The Style Icon', desc: 'Every outfit planned. None of them paid for.', icon: 'shirt' },
  men: { title: 'The Style Icon', desc: 'Every outfit planned. None of them paid for.', icon: 'shirt' },
  shoes: { title: 'The Sneakerhead', desc: 'A closet full of pretend kicks.', icon: 'footsteps' },
  bags: { title: 'The Bag Collector', desc: 'There is always room for one more bag.', icon: 'bag-handle' },
  toys: { title: 'The Kid at Heart', desc: 'Plushies, puzzles and zero regrets.', icon: 'game-controller' },
  home: { title: 'The Nest Builder', desc: 'Your pretend home is cozy and candle-lit.', icon: 'home' },
  sports: { title: 'The Weekend Athlete', desc: 'Fully equipped. Workout pending.', icon: 'barbell' },
  pets: { title: 'The Fur Parent', desc: 'Your pets are the best-dressed in the barangay.', icon: 'paw' },
};

export function monthRange(now: number, offset = 0): [number, number] {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth() + offset, 1).getTime();
  const end = new Date(d.getFullYear(), d.getMonth() + offset + 1, 1).getTime();
  return [start, end];
}

export function computeWrapped(s: S, now: number, offset = 0): Wrapped {
  const [start, end] = monthRange(now, offset);
  const inMonth = (t: number) => t >= start && t < end;
  const orders = s.orders.filter((o) => !o.cancelledAt && inMonth(o.createdAt));
  const lines = orders.flatMap((o) => o.shops.flatMap((sh) => sh.items.map((i) => ({ ...i, shopId: sh.shopId }))));
  const items = lines.reduce((n, l) => n + l.qty, 0);

  const catCount: Record<string, number> = {};
  const shopCount: Record<string, number> = {};
  let priciest: Wrapped['priciest'] = null;
  for (const l of lines) {
    const p = getProduct(l.productId);
    if (!p) continue;
    catCount[p.categoryId] = (catCount[p.categoryId] ?? 0) + l.qty;
    shopCount[l.shopId] = (shopCount[l.shopId] ?? 0) + l.qty;
    if (!priciest || l.unitPrice > priciest.price) priciest = { product: p, price: l.unitPrice };
  }
  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
  const topShopEntry = Object.entries(shopCount).sort((a, b) => b[1] - a[1])[0];
  const reviews = s.reviews.filter((r) => inMonth(r.createdAt)).length;
  const resistedList = s.resisted.filter((r) => inMonth(r.at));
  const resisted = resistedList.reduce((n, r) => n + r.amount, 0);
  const kept = orders.reduce((n, o) => n + o.total, 0);

  let persona: Persona;
  if (!orders.length) persona = { title: 'The Window Shopper', desc: 'Just looking, for now. Your cart is waiting.', icon: 'eye' };
  else if (resisted > kept) persona = { title: 'The Iron Wallet', desc: 'You changed your mind more than you checked out. Impressive.', icon: 'shield-checkmark' };
  else if (orders.length >= 8) persona = { title: 'The Haul Champion', desc: 'Parcels arrive faster than you can unbox them.', icon: 'trophy' };
  else if (reviews >= 5) persona = { title: 'The Critic', desc: 'Sellers fear and respect your ratings.', icon: 'star' };
  else persona = BY_CATEGORY[topCat?.[0] ?? ''] ?? { title: 'The Smart Shopper', desc: 'All the joy of shopping, none of the bills.', icon: 'bag-check' };

  const monthIdx = new Date(start).getMonth();
  return {
    label: MONTHS[monthIdx],
    orders: orders.length,
    items,
    kept,
    saved: orders.reduce((n, o) => n + o.saved, 0),
    coins: orders.reduce((n, o) => n + o.coinsEarned, 0) + reviews * 5,
    reviews,
    resisted,
    resistedCount: resistedList.length,
    topCategory: topCat ? { category: getCategory(topCat[0])!, count: topCat[1] } : null,
    topShop: topShopEntry ? { name: getShop(topShopEntry[0]).name, count: topShopEntry[1] } : null,
    priciest,
    achievements: Object.values(s.achievements).filter(inMonth).length,
    persona,
  };
}
