import { PRODUCTS, Product, getProduct, hash, rng } from './catalog';

export type Stream = {
  id: string;
  host: string;
  shopId: string;
  title: string;
  baseViewers: number;
  productIds: string[];
  colors: [string, string];
};

const HOSTS: [host: string, shopId: string, title: string, colors: [string, string]][] = [
  ['Ate Rosie', 's1', 'OOTD haul! Dresses under ₱499', ['#DB2777', '#F472B6']],
  ['Tito Boy Tech', 's3', 'Gadget sulit picks + live-only prices', ['#1D4ED8', '#38BDF8']],
  ['Mika Glow', 's6', 'Skincare routine & lip tint swatches', ['#BE185D', '#FDA4AF']],
  ['Kuya Jun', 's8', 'Pantry restock: ramen, kape, mangga', ['#B45309', '#FBBF24']],
  ['Coach Ana', 's11', 'Home workout gear that actually works', ['#047857', '#34D399']],
  ['Bea Closet', 's14', 'Mura Lang Store mystery picks', ['#7C3AED', '#C084FC']],
];

export const STREAMS: Stream[] = HOSTS.map(([host, shopId, title, colors], i) => {
  const r = rng(hash(`live:${i}`));
  const own = PRODUCTS.filter((p) => p.shopId === shopId);
  const pool = own.length >= 4 ? own : PRODUCTS;
  const productIds = Array.from(new Set(Array.from({ length: 6 }, () => pool[Math.floor(r() * pool.length)].id)));
  return { id: `live${i}`, host, shopId, title, baseViewers: 300 + Math.floor(r() * 4000), productIds, colors };
});

export const getStream = (id: string) => STREAMS.find((s) => s.id === id);

export const ITEM_MS = 25_000;

/** The host moves to the next item every 25 seconds, the same for everyone. */
export function currentItem(s: Stream, now: number): { product: Product; index: number; endsIn: number } {
  const n = Math.floor(now / ITEM_MS);
  const index = n % s.productIds.length;
  return { product: getProduct(s.productIds[index])!, index, endsIn: (n + 1) * ITEM_MS - now };
}

export function livePrice(p: Product): number {
  return Math.max(9, Math.round((p.price * 0.82) / 10) * 10 - 1);
}

/** Viewer count wobbles so the room feels alive. */
export function viewers(s: Stream, now: number): number {
  const t = now / 7000;
  return Math.round(s.baseViewers * (1 + 0.08 * Math.sin(t) + 0.04 * Math.sin(t * 2.7)));
}

/** Stock for the pinned item drains while it's on screen. */
export function liveStock(s: Stream, now: number): number {
  const { index, endsIn } = currentItem(s, now);
  const start = 30 + (hash(`${s.id}:${index}`) % 40);
  return Math.max(1, Math.round(start * (endsIn / ITEM_MS)));
}

const NAMES = ['jen***', 'mark_ph', 'bes.carla', 'kiko23', 'ate.liza', 'jm.reyes', 'pao_', 'rica**', 'tonton', 'yna.b', 'dodong88', 'sheng'];
const LINES = [
  'Mine po!',
  'Mine! 2 pcs',
  'Available pa po size M?',
  'Legit seller, repeat buyer here',
  'Pa-checkout na ako',
  'Ganda!!!',
  'Ships today po?',
  'Mine po isa',
  'Hm po shipping sa Cebu?',
  'Sulit talaga dito',
  'Got mine last week, super ganda',
  'Mine! Last na sana',
  'Pwede COD?',
  'Add to cart na agad',
];

export type LiveComment = { id: string; name: string; text: string; me?: boolean };

export function randomComment(seed: number): LiveComment {
  const r = rng(seed);
  return { id: `c${seed}`, name: NAMES[Math.floor(r() * NAMES.length)], text: LINES[Math.floor(r() * LINES.length)] };
}
