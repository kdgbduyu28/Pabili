import type { Order } from '../store/useShop';
import { APP_URL } from './share';

/** Everything the recipient's device needs to show the gift, packed into the link itself. */
export type GiftPayload = { f: string; t: string; m: string; w: string; i: string[] };

export function giftLink(o: Order): string | null {
  if (!o.gift) return null;
  const payload: GiftPayload = {
    f: o.address.name.split(' ')[0],
    t: o.gift.to,
    m: o.gift.message,
    w: o.gift.wrap,
    i: o.shops.flatMap((s) => s.items.map((i) => i.productId)).slice(0, 12),
  };
  return `${APP_URL}/gift?d=${encodeURIComponent(JSON.stringify(payload))}`;
}

export function parseGift(d: string | undefined): GiftPayload | null {
  if (!d) return null;
  try {
    const g = JSON.parse(d) as GiftPayload;
    if (typeof g.t !== 'string' || !Array.isArray(g.i)) return null;
    return { f: String(g.f ?? '').slice(0, 40), t: g.t.slice(0, 40), m: String(g.m ?? '').slice(0, 200), w: String(g.w ?? ''), i: g.i.map(String).slice(0, 12) };
  } catch {
    return null;
  }
}
