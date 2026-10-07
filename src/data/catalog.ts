// Everything here is generated from a fixed seed, so the "store" is identical on
// every device and every launch without shipping a database.

import type Ionicons from '@expo/vector-icons/Ionicons';

export type Category = { id: string; name: string; icon: keyof typeof Ionicons.glyphMap };

export type VariantGroup = { name: string; options: string[]; mult?: number[] };

export type Shop = {
  id: string;
  name: string;
  location: string;
  mall: boolean;
  preferred: boolean;
  rating: number;
  followers: number;
  responseRate: number;
  categories: string[];
};

export type Product = {
  id: string;
  title: string;
  name: string;
  emoji: string;
  categoryId: string;
  shopId: string;
  price: number;
  originalPrice: number;
  discountPct: number;
  sold: number;
  rating: number;
  ratingCount: number;
  freeShipping: boolean;
  cod: boolean;
  stock: number;
  listedDaysAgo: number;
  gradient: [string, string];
  variants: VariantGroup[];
  description: string;
};

export type Review = { user: string; rating: number; text: string; variant: string; daysAgo: number };

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];

export const CATEGORIES: Category[] = [
  { id: 'women', name: "Women's Fashion", icon: 'woman-outline' },
  { id: 'men', name: "Men's Fashion", icon: 'man-outline' },
  { id: 'gadgets', name: 'Mobiles & Gadgets', icon: 'phone-portrait-outline' },
  { id: 'home', name: 'Home & Living', icon: 'bed-outline' },
  { id: 'beauty', name: 'Beauty', icon: 'sparkles-outline' },
  { id: 'food', name: 'Groceries', icon: 'basket-outline' },
  { id: 'toys', name: 'Toys & Games', icon: 'game-controller-outline' },
  { id: 'sports', name: 'Sports & Outdoors', icon: 'basketball-outline' },
  { id: 'shoes', name: 'Shoes', icon: 'footsteps-outline' },
  { id: 'pets', name: 'Pet Care', icon: 'paw-outline' },
  { id: 'bags', name: 'Bags & Travel', icon: 'bag-handle-outline' },
  { id: 'computers', name: 'Computers', icon: 'laptop-outline' },
];

const V: Record<string, VariantGroup[]> = {
  apparel: [
    { name: 'Color', options: ['Black', 'White', 'Beige', 'Dusty Pink', 'Sage'] },
    { name: 'Size', options: ['S', 'M', 'L', 'XL'] },
  ],
  shoes: [
    { name: 'Color', options: ['Black', 'White', 'Cream', 'Grey'] },
    { name: 'Size', options: ['37', '38', '39', '40', '41', '42', '43'] },
  ],
  color: [{ name: 'Color', options: ['Midnight', 'Snow', 'Ocean', 'Lavender'] }],
  home: [{ name: 'Color', options: ['Cream', 'Grey', 'Olive', 'Terracotta'] }],
  shade: [{ name: 'Shade', options: ['01 Rosy', '02 Coral', '03 Nude', '04 Berry'] }],
  size: [{ name: 'Size', options: ['Travel', 'Regular', 'Value Pack'], mult: [0.6, 1, 1.8] }],
  pack: [{ name: 'Pack', options: ['1 pc', '3 pcs', '6 pcs'], mult: [1, 2.8, 5.2] }],
  storage: [
    { name: 'Color', options: ['Graphite', 'Silver', 'Rose'] },
    { name: 'Capacity', options: ['256GB', '512GB', '1TB'], mult: [1, 1.5, 2.2] },
  ],
  none: [],
};

type Template = [emoji: string, name: string, min: number, max: number, variants: keyof typeof V];

const TEMPLATES: Record<string, Template[]> = {
  women: [
    ['👗', 'Floral Midi Dress', 249, 899, 'apparel'],
    ['👚', 'Ribbed Crop Top', 99, 299, 'apparel'],
    ['🩳', 'High Waist Denim Shorts', 199, 499, 'apparel'],
    ['🧥', 'Oversized Knit Cardigan', 299, 799, 'apparel'],
    ['👙', 'Two-Piece Swimsuit', 199, 599, 'apparel'],
    ['🧣', 'Plaid Winter Scarf', 99, 349, 'color'],
    ['👘', 'Satin Pajama Set', 249, 699, 'apparel'],
  ],
  men: [
    ['👕', 'Oversized Cotton Tee', 99, 399, 'apparel'],
    ['👔', 'Linen Polo Shirt', 249, 799, 'apparel'],
    ['👖', 'Slim Fit Cargo Pants', 299, 899, 'apparel'],
    ['🧢', 'Embroidered Baseball Cap', 99, 349, 'color'],
    ['🧦', 'Ankle Socks 10 Pairs', 79, 249, 'none'],
    ['🩲', 'Boxer Briefs 3-Pack', 149, 449, 'apparel'],
  ],
  gadgets: [
    ['📱', 'MagSafe Phone Case', 99, 499, 'color'],
    ['🎧', 'Wireless Earbuds ANC', 499, 2999, 'color'],
    ['🔋', 'Power Bank 20000mAh', 399, 1499, 'color'],
    ['⌚', 'Smart Watch Fitness Tracker', 799, 3999, 'color'],
    ['🔌', '65W GaN Fast Charger', 299, 1299, 'none'],
    ['📷', 'Mini Instant Camera', 1999, 4999, 'color'],
    ['🎮', 'Bluetooth Game Controller', 599, 2499, 'color'],
  ],
  home: [
    ['🛋️', 'Boucle Throw Pillow Cover', 99, 399, 'home'],
    ['🕯️', 'Scented Soy Candle', 149, 599, 'home'],
    ['🪴', 'Self-Watering Planter', 129, 499, 'home'],
    ['🧺', 'Foldable Laundry Basket', 149, 399, 'home'],
    ['💡', 'LED Strip Lights 10m', 199, 699, 'none'],
    ['🍳', 'Non-Stick Frying Pan 28cm', 399, 1299, 'none'],
    ['🛏️', 'Cooling Bedsheet Set', 499, 1499, 'home'],
    ['⏰', 'Minimalist Wall Clock', 199, 699, 'home'],
  ],
  beauty: [
    ['💄', 'Velvet Matte Lip Tint', 79, 399, 'shade'],
    ['🧴', 'Sunscreen SPF50 PA++++', 199, 799, 'size'],
    ['🧼', 'Gentle Foam Cleanser', 149, 599, 'size'],
    ['💅', 'Gel Nail Polish Set', 199, 699, 'shade'],
    ['🌸', 'Eau de Parfum 50ml', 399, 1999, 'size'],
    ['🫧', 'Hydrating Sheet Mask 10pcs', 99, 399, 'none'],
  ],
  food: [
    ['🍜', 'Spicy Ramen 5-Pack', 129, 349, 'pack'],
    ['☕', 'Barako Coffee Beans 500g', 249, 599, 'pack'],
    ['🍫', 'Dark Chocolate Bar Box', 149, 499, 'pack'],
    ['🥭', 'Dried Mangoes 1kg', 299, 699, 'pack'],
    ['🍿', 'Cheese Popcorn Tub', 79, 199, 'pack'],
    ['🧋', 'Milk Tea Powder Kit', 199, 499, 'pack'],
    ['🍯', 'Wild Honey 500ml', 249, 699, 'pack'],
  ],
  toys: [
    ['🧸', 'Plush Bear 40cm', 199, 799, 'color'],
    ['🧩', '1000pc Jigsaw Puzzle', 249, 699, 'none'],
    ['🚗', 'RC Drift Car', 599, 2499, 'color'],
    ['🎲', 'Party Board Game', 299, 1299, 'none'],
    ['🪁', 'Rainbow Kite', 99, 349, 'none'],
    ['🤖', 'STEM Robot Kit', 799, 2999, 'none'],
  ],
  sports: [
    ['🏀', 'Indoor/Outdoor Basketball', 399, 1499, 'none'],
    ['🧘', 'Non-Slip Yoga Mat 6mm', 299, 999, 'color'],
    ['🏋️', 'Adjustable Dumbbell Pair', 999, 3999, 'none'],
    ['🏸', 'Badminton Racket Set', 399, 1799, 'color'],
    ['🥤', 'Insulated Tumbler 1L', 249, 899, 'color'],
    ['🏊', 'Anti-Fog Swim Goggles', 149, 599, 'color'],
  ],
  shoes: [
    ['👟', 'Chunky Running Sneakers', 599, 2499, 'shoes'],
    ['🥿', 'Comfy Ballet Flats', 299, 899, 'shoes'],
    ['🩴', 'Cloud Slides', 149, 499, 'shoes'],
    ['👢', 'Chelsea Boots', 899, 2999, 'shoes'],
    ['👞', 'Leather Penny Loafers', 799, 2499, 'shoes'],
  ],
  pets: [
    ['🐶', 'Dog Chew Toy Set', 149, 499, 'none'],
    ['🐱', 'Cat Scratching Post', 299, 999, 'home'],
    ['🦴', 'Grain-Free Dog Treats', 149, 449, 'pack'],
    ['🐾', 'Pet Grooming Glove', 99, 299, 'none'],
    ['🐟', 'Aquarium LED Light', 299, 899, 'none'],
  ],
  bags: [
    ['👜', 'Mini Shoulder Bag', 249, 999, 'color'],
    ['🎒', 'Anti-Theft Laptop Backpack', 499, 1799, 'color'],
    ['👛', 'Zip Coin Purse', 79, 299, 'color'],
    ['💼', 'Vegan Leather Tote', 399, 1499, 'color'],
    ['🧳', 'Cabin Luggage 20in', 1499, 4999, 'color'],
  ],
  computers: [
    ['💻', 'Aluminum Laptop Stand', 299, 999, 'none'],
    ['⌨️', 'Mechanical Keyboard RGB', 999, 3999, 'color'],
    ['🖱️', 'Silent Wireless Mouse', 199, 899, 'color'],
    ['🖥️', '24in IPS Monitor 100Hz', 4999, 8999, 'none'],
    ['💾', 'Portable SSD', 1999, 4999, 'storage'],
    ['🎙️', 'USB Condenser Mic', 699, 2499, 'none'],
  ],
};

const ALL = CATEGORIES.map((c) => c.id);

const SHOP_ROWS: [name: string, location: string, mall: boolean, cats: string[]][] = [
  ['Pabili Mall Official', 'Metro Manila', true, ALL],
  ['Ganda Closet', 'Metro Manila', false, ['women', 'bags', 'shoes']],
  ['Pogi Threads', 'Cebu', false, ['men', 'shoes']],
  ['Techie Tambayan', 'Metro Manila', false, ['gadgets', 'computers']],
  ['GadgetHub Global', 'Overseas', false, ['gadgets', 'computers', 'toys']],
  ['Bahay Basics', 'Laguna', false, ['home', 'pets']],
  ['Tita Glow Beauty', 'Metro Manila', false, ['beauty']],
  ['Glow Lab Official', 'Metro Manila', true, ['beauty']],
  ['Sari-Sari Express', 'Bulacan', false, ['food']],
  ['Kusina Essentials', 'Pampanga', false, ['food', 'home']],
  ['Laro Toy Shop', 'Davao', false, ['toys']],
  ['Takbo Sports', 'Metro Manila', true, ['sports', 'shoes']],
  ['Furbaby Corner', 'Cavite', false, ['pets']],
  ['Bagsakan Bags', 'Overseas', false, ['bags', 'women']],
  ['Mura Lang Store', 'Overseas', false, ALL],
  ['Sapatos Central', 'Marikina', false, ['shoes']],
];

export const SHOPS: Shop[] = SHOP_ROWS.map(([name, location, mall, categories], i) => {
  const r = rng(1000 + i);
  return {
    id: `s${i}`,
    name,
    location,
    mall,
    preferred: !mall && r() > 0.35,
    rating: Math.round((4.5 + r() * 0.5) * 10) / 10,
    followers: Math.floor(1000 + r() * r() * 400000),
    responseRate: Math.floor(85 + r() * 15),
    categories,
  };
});

const PALETTES: [string, string][] = [
  ['#FFE4E6', '#FECDD3'],
  ['#FFEDD5', '#FED7AA'],
  ['#FEF9C3', '#FDE68A'],
  ['#DCFCE7', '#BBF7D0'],
  ['#CCFBF1', '#99F6E4'],
  ['#E0F2FE', '#BAE6FD'],
  ['#E0E7FF', '#C7D2FE'],
  ['#F3E8FF', '#E9D5FF'],
  ['#FCE7F3', '#FBCFE8'],
  ['#F1F5F9', '#E2E8F0'],
];

const TAGS = ['', '', '', '[Ready Stock]', '[COD]', '[Bestseller]', '2026 New', '[Free Gift]', '[Local Seller]', '[Hot Item]'];
const ADJ = ['Premium', 'Korean Style', 'Minimalist', 'Aesthetic', 'Heavy Duty', 'Ultra Soft', 'Classic', 'Viral', 'Pro', 'Everyday'];
const SUFFIX = ['', '', 'Unisex', 'High Quality', 'Original', 'Fast Shipping', 'Limited Edition', 'Gift Ready'];

function endIn9(x: number) {
  return Math.max(9, Math.round(x / 10) * 10 - 1);
}

function describe(name: string, location: string, variants: VariantGroup[]) {
  const opts = variants.map((v) => `• ${v.name}: ${v.options.join(', ')}`).join('\n');
  return [
    `${name} — the one everyone's been adding to cart.`,
    '',
    '✔ Made for everyday use',
    `✔ Ships from ${location}`,
    '✔ 100% pretend: no real money ever leaves your wallet',
    ...(opts ? ['', 'Available options:', opts] : []),
    '',
    "What's in the box:",
    `• 1 × ${name}`,
    '• 1 × warm, fuzzy, just-checked-out feeling',
    '',
    'Note: colors may vary slightly due to lighting and the fact that this product does not exist.',
  ].join('\n');
}

function buildProducts(): Product[] {
  const out: Product[] = [];
  let n = 0;
  for (const cat of CATEGORIES) {
    const shops = SHOPS.filter((s) => s.categories.includes(cat.id));
    TEMPLATES[cat.id].forEach(([emoji, name, min, max, vk], ti) => {
      for (let k = 0; k < 2; k++) {
        const r = rng(hash(`${cat.id}:${ti}:${k}`));
        const shop = pick(r, shops);
        const price = endIn9(min + r() * (max - min));
        const d = r() < 0.2 ? 0 : 5 + Math.floor(r() * 60);
        const originalPrice = d ? endIn9(price / (1 - d / 100)) : price;
        const discountPct = Math.round((1 - price / originalPrice) * 100);
        const sold = Math.floor(Math.pow(r(), 2.5) * 25000);
        const title = [pick(r, TAGS), pick(r, ADJ), name, pick(r, SUFFIX)].filter(Boolean).join(' ');
        const variants = V[vk];
        out.push({
          id: `p${n++}`,
          title,
          name,
          emoji,
          categoryId: cat.id,
          shopId: shop.id,
          price,
          originalPrice,
          discountPct,
          sold,
          rating: Math.round((4.2 + r() * 0.8) * 10) / 10,
          ratingCount: Math.floor(sold * (0.15 + r() * 0.3)),
          freeShipping: shop.mall || r() > 0.45,
          cod: shop.location !== 'Overseas' && r() > 0.3,
          stock: Math.floor(5 + r() * 900),
          listedDaysAgo: Math.floor(r() * 120),
          gradient: pick(r, PALETTES),
          variants,
          description: describe(name, shop.location, variants),
        });
      }
    });
  }
  return out;
}

export const PRODUCTS: Product[] = buildProducts();

const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
const shopById = new Map(SHOPS.map((s) => [s.id, s]));
const catById = new Map(CATEGORIES.map((c) => [c.id, c]));

export const getProduct = (id: string) => byId.get(id);
export const getShop = (id: string) => shopById.get(id)!;
export const getCategory = (id: string) => catById.get(id);

export function variantMultiplier(p: Product, variant: Record<string, string>): number {
  let m = 1;
  for (const g of p.variants) {
    if (!g.mult) continue;
    const i = g.options.indexOf(variant[g.name]);
    if (i >= 0) m *= g.mult[i];
  }
  return m;
}

export function variantLabel(variant: Record<string, string>): string {
  return Object.values(variant).join(', ');
}

/** Same products in a stable but scrambled order, used for "Daily Discover". */
export function shuffled(seed: number): Product[] {
  const r = rng(seed);
  const xs = PRODUCTS.slice();
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}

export function similar(p: Product, n = 12): Product[] {
  const same = PRODUCTS.filter((x) => x.categoryId === p.categoryId && x.id !== p.id);
  const rest = shuffled(hash(p.id)).filter((x) => x.categoryId !== p.categoryId);
  return [...same, ...rest].slice(0, n);
}

const REVIEW_TEXT = [
  'Fast delivery! Item exactly as pictured. 😍',
  'Super sulit for the price. Will order again!',
  'Packaging was very secure, no damage at all.',
  'Quality exceeded my expectations, legit seller 🙏',
  'Seller was very responsive. 5 stars!',
  'Medyo matagal dumating pero okay naman ang item.',
  'Love it! Bought another one for my sister.',
  'Exactly what I needed. Thank you seller!',
  'Looks even better in person ✨',
];
const REVIEW_USERS = ['m*****a', 'j***n', 'k****e', 'a******o', 'r***y', 'b*****s', 'c***l', 'p******8'];

export function reviewsFor(p: Product): Review[] {
  const r = rng(hash(`rev:${p.id}`));
  return Array.from({ length: 3 }, () => ({
    user: pick(r, REVIEW_USERS),
    rating: r() > 0.2 ? 5 : 4,
    text: pick(r, REVIEW_TEXT),
    variant: p.variants.map((g) => pick(r, g.options)).join(', '),
    daysAgo: 1 + Math.floor(r() * 60),
  }));
}

export const TRENDING = ['oversized tee', 'earbuds', 'tumbler', 'lip tint', 'sneakers', 'power bank', 'ramen', 'keyboard'];

export function search(q: string): Product[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return PRODUCTS.filter((p) => {
    const hay = `${p.title} ${getCategory(p.categoryId)?.name} ${getShop(p.shopId).name}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

export function fromShop(p: Product, n = 10): Product[] {
  return PRODUCTS.filter((x) => x.shopId === p.shopId && x.id !== p.id).slice(0, n);
}

/** Two items from other categories that "people often buy" with this one. */
export function boughtTogether(p: Product): Product[] {
  const pool = shuffled(hash(`fbt:${p.id}`)).filter((x) => x.categoryId !== p.categoryId && x.price <= Math.max(499, p.price));
  return pool.slice(0, 2);
}

export function defaultVariant(p: Product): Record<string, string> {
  return Object.fromEntries(p.variants.map((g) => [g.name, g.options[0]]));
}

export type SizeChart = { columns: string[]; rows: string[][] };

const APPAREL_CHART: SizeChart = {
  columns: ['Size', 'Chest (cm)', 'Length (cm)', 'Fits'],
  rows: [
    ['S', '86–91', '66', '45–55 kg'],
    ['M', '91–97', '69', '55–65 kg'],
    ['L', '97–104', '72', '65–75 kg'],
    ['XL', '104–112', '75', '75–85 kg'],
  ],
};

const SHOE_CHART: SizeChart = {
  columns: ['EU', 'US (M)', 'US (W)', 'Foot (cm)'],
  rows: [
    ['37', '5', '6.5', '23.5'],
    ['38', '6', '7.5', '24.0'],
    ['39', '6.5', '8', '24.5'],
    ['40', '7', '9', '25.0'],
    ['41', '8', '9.5', '25.5'],
    ['42', '8.5', '10', '26.5'],
    ['43', '9.5', '11', '27.0'],
  ],
};

export function sizeChartFor(p: Product): SizeChart | null {
  const size = p.variants.find((g) => g.name === 'Size');
  if (!size) return null;
  if (size.options.includes('M')) return APPAREL_CHART;
  if (size.options.includes('40')) return SHOE_CHART;
  return null;
}

export type Suggestion = { text: string; kind: 'product' | 'category' | 'shop'; id?: string };

/** Type-ahead: categories and shops first, then distinct product names. */
export function suggest(q: string, n = 8): Suggestion[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const out: Suggestion[] = [];
  for (const c of CATEGORIES) if (c.name.toLowerCase().includes(t)) out.push({ text: c.name, kind: 'category', id: c.id });
  for (const s of SHOPS) if (s.name.toLowerCase().includes(t)) out.push({ text: s.name, kind: 'shop', id: s.id });
  const names = new Set<string>();
  for (const p of PRODUCTS) {
    if (p.name.toLowerCase().includes(t) && !names.has(p.name)) {
      names.add(p.name);
      out.push({ text: p.name, kind: 'product' });
    }
  }
  return out.slice(0, n);
}

/** "Search by photo": a stable pretend match from the picked image to a category. */
export function photoCategory(uri: string, width: number, height: number): Category {
  return CATEGORIES[hash(`${uri.slice(-40)}:${width}x${height}`) % CATEGORIES.length];
}
