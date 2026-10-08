import { describe, expect, it } from 'vitest';
import { PRODUCTS } from '../data/catalog';
import { restockAt } from '../data/extras';
import type { Order } from '../store/useShop';
import { deliveredAt } from './orders';
import { DAILY_ID, plan } from './reminders';

const NOW = new Date(2026, 9, 7, 9, 30).getTime();
const empty = { orders: [] as Order[], restockAlerts: [] as string[], group: null, slash: null };

function order(id: string, createdAt: number, extra: Partial<Order> = {}): Order {
  return {
    id,
    createdAt,
    shops: [],
    subtotal: 0,
    shippingTotal: 0,
    shippingDiscount: 0,
    voucherId: null,
    voucherDiscount: 0,
    coinsUsed: 0,
    coinsEarned: 0,
    total: 0,
    saved: 0,
    payment: 'Pretend Pay',
    address: { name: '', phone: '', line1: '', city: '' },
    ...extra,
  };
}

const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

describe('plan', () => {
  it('always includes the daily coin reminder', () => {
    expect(ids(plan(empty, NOW))).toEqual([DAILY_ID]);
  });

  it('schedules a parcel arrival for orders still on the way', () => {
    const o = order('PB1', NOW - 10_000);
    const p = plan({ ...empty, orders: [o] }, NOW).find((x) => x.id === 'order:PB1');
    expect(p && 'at' in p && p.at).toBe(deliveredAt(o));
    expect(p?.href).toBe('/unbox/PB1');
  });

  it('skips orders that are cancelled, unboxed or already delivered', () => {
    const orders = [
      order('A', NOW - 10_000, { cancelledAt: NOW }),
      order('B', NOW - 10_000, { receivedAt: NOW }),
      order('C', NOW - 24 * 3600_000),
    ];
    expect(ids(plan({ ...empty, orders }, NOW))).toEqual([DAILY_ID]);
  });

  it('schedules restock alerts only for items that restock later today', () => {
    const soon = PRODUCTS.find((p) => (restockAt(p, NOW) ?? 0) > NOW);
    const never = PRODUCTS.find((p) => restockAt(p, NOW) === null)!;
    const out = ids(plan({ ...empty, restockAlerts: [never.id, ...(soon ? [soon.id] : [])] }, NOW));
    expect(out).not.toContain(`restock:${never.id}`);
    if (soon) expect(out).toContain(`restock:${soon.id}`);
  });

  it('announces a group buy once the last seat is due to fill', () => {
    const members = [
      { name: 'You', at: NOW - 1000 },
      { name: 'a', at: NOW + 5000 },
      { name: 'b', at: NOW + 9000 },
    ];
    const group = { productId: PRODUCTS[0].id, price: 99, size: 3, startedAt: NOW - 1000, members };
    const g = plan({ ...empty, group }, NOW).find((x) => x.id.startsWith('group:'));
    expect(g && 'at' in g && g.at).toBe(NOW + 9000);
    const short = plan({ ...empty, group: { ...group, members: members.slice(0, 2) } }, NOW);
    expect(ids(short).some((id) => id.startsWith('group:'))).toBe(false);
  });

  it('announces a slash only when the cuts reach the full price', () => {
    const base = { productId: PRODUCTS[0].id, start: 300, startedAt: NOW - 1000, invites: 5 };
    const done = { ...base, cuts: [{ name: 'You', amount: 100, at: NOW - 1000 }, { name: 'Ate Joy', amount: 200, at: NOW + 4000 }] };
    const partial = { ...base, cuts: [{ name: 'You', amount: 100, at: NOW - 1000 }] };
    expect(ids(plan({ ...empty, slash: done }, NOW))).toContain(`slash:${base.startedAt}`);
    expect(ids(plan({ ...empty, slash: partial }, NOW)).some((id) => id.startsWith('slash:'))).toBe(false);
  });
});
