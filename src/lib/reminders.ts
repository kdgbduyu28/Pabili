import { getProduct } from '../data/catalog';
import { restockAt } from '../data/extras';
import type { GroupBuy, Order, Slash } from '../store/useShop';
import { peso } from './format';
import { deliveredAt } from './orders';

export type Planned =
  | { id: string; title: string; body: string; href: string; at: number }
  | { id: string; title: string; body: string; href: string; daily: { hour: number; minute: number } };

type Input = { orders: Order[]; restockAlerts: string[]; group: GroupBuy | null; slash: Slash | null };

export const DAILY_ID = 'daily-coins';

/** Every notification the current state calls for, keyed by a stable id. */
export function plan(s: Input, now: number): Planned[] {
  const out: Planned[] = [];
  for (const o of s.orders) {
    const at = deliveredAt(o);
    if (o.cancelledAt || o.receivedAt || at <= now) continue;
    out.push({ id: `order:${o.id}`, title: 'Your parcel is here!', body: `Order ${o.id} was delivered. Tap to unbox it.`, href: `/unbox/${o.id}`, at });
  }
  for (const pid of s.restockAlerts) {
    const p = getProduct(pid);
    const at = p ? restockAt(p, now) : null;
    if (!p || at === null || at <= now) continue;
    out.push({ id: `restock:${pid}`, title: `Back in stock: ${p.name}`, body: 'Grab it before it sells out again.', href: `/product/${pid}`, at });
  }
  const g = s.group;
  if (g && !g.claimedAt && g.members.length >= g.size) {
    const at = Math.max(...g.members.map((m) => m.at));
    const p = getProduct(g.productId);
    if (at > now && p) out.push({ id: `group:${g.startedAt}`, title: 'Your group is complete!', body: `Check out ${p.name} for ${peso(g.price)}.`, href: '/group', at });
  }
  const sl = s.slash;
  if (sl && !sl.claimedAt) {
    const total = sl.cuts.reduce((n, c) => n + c.amount, 0);
    const at = Math.max(...sl.cuts.map((c) => c.at));
    const p = getProduct(sl.productId);
    if (total >= sl.start && at > now && p) out.push({ id: `slash:${sl.startedAt}`, title: 'Slashed to ₱0!', body: `Claim your free ${p.name}.`, href: '/slash', at });
  }
  out.push({ id: DAILY_ID, title: 'Your daily coins are waiting', body: 'Check in to keep your streak going.', href: '/me', daily: { hour: 9, minute: 0 } });
  return out;
}
