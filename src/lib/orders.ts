import { hash } from '../data/catalog';
import type { Order } from '../store/useShop';

export type OrderStatus = 'to_ship' | 'to_receive' | 'delivered' | 'completed' | 'cancelled' | 'returned';

export type OrderTab = 'to_ship' | 'to_receive' | 'completed' | 'cancelled';

export const ORDER_TABS: { id: OrderTab; label: string }[] = [
  { id: 'to_ship', label: 'To Ship' },
  { id: 'to_receive', label: 'To Receive' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

type Step = { at: number; title: string; detail: string };

// Pretend parcels move fast: the whole journey takes about four minutes.
const STEPS: Step[] = [
  { at: 0, title: 'Order placed', detail: 'Your pretend payment went through' },
  { at: 20_000, title: 'Seller is preparing your parcel', detail: 'Wrapping it in imaginary bubble wrap' },
  { at: 60_000, title: 'Parcel has been shipped out', detail: 'Handed over to Pabili Xpress' },
  { at: 150_000, title: 'Out for delivery', detail: 'Rider is on the way' },
  { at: 240_000, title: 'Parcel delivered', detail: 'Received by: You (in spirit)' },
];

const LATE_DELAY = 90_000;

/** About one in four parcels runs late, which earns a sorry voucher. */
export function isLate(o: Order): boolean {
  return hash(`late:${o.id}`) % 4 === 0;
}

function steps(o: Order): Step[] {
  if (!isLate(o)) return STEPS;
  return [
    ...STEPS.slice(0, 3),
    { at: 110_000, title: 'Delivery delayed', detail: 'Heavy traffic at the sorting hub. A ₱50 voucher is coming your way.' },
    ...STEPS.slice(3).map((s) => ({ ...s, at: s.at + LATE_DELAY })),
  ];
}

/** When the parcel is (or will be) delivered. */
export function deliveredAt(o: Order): number {
  const s = steps(o);
  return o.createdAt + s[s.length - 1].at;
}

export function orderStatus(o: Order, now: number): OrderStatus {
  if (o.cancelledAt) return 'cancelled';
  if (o.returnedAt) return 'returned';
  if (o.receivedAt) return 'completed';
  const t = now - o.createdAt;
  const s = steps(o);
  if (t < STEPS[2].at) return 'to_ship';
  if (t < s[s.length - 1].at) return 'to_receive';
  return 'delivered';
}

export function orderTab(s: OrderStatus): OrderTab {
  if (s === 'delivered') return 'to_receive';
  if (s === 'returned') return 'cancelled';
  return s;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  to_ship: 'TO SHIP',
  to_receive: 'IN TRANSIT',
  delivered: 'DELIVERED',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
  returned: 'RETURNED',
};

export type TimelineStep = { title: string; detail: string; at: number };

export function timeline(o: Order, now: number): TimelineStep[] {
  if (o.cancelledAt) {
    return [
      { title: 'Order cancelled', detail: 'Your ₱0 refund is on its way', at: o.cancelledAt },
      { title: 'Order placed', detail: STEPS[0].detail, at: o.createdAt },
    ];
  }
  const out: TimelineStep[] = steps(o)
    .filter((s) => now - o.createdAt >= s.at)
    .map((s) => ({ title: s.title, detail: s.detail, at: o.createdAt + s.at }));
  if (o.receivedAt) out.push({ title: 'Parcel unboxed', detail: 'Enjoy your new (pretend) stuff!', at: o.receivedAt });
  if (o.returnedAt) {
    out.push({
      title: 'Return accepted',
      detail: `Reason: ${o.returnReason ?? 'Change of mind'}. Refund of ₱0 completed.`,
      at: o.returnedAt,
    });
  }
  return out.reverse();
}

/** Returns are allowed for 15 "days", which in Pabili time is 15 minutes. */
export const RETURN_WINDOW_MS = 15 * 60_000;

export function canReturn(o: Order, now: number): boolean {
  return !!o.receivedAt && !o.returnedAt && now - o.receivedAt < RETURN_WINDOW_MS;
}

export function orderItemCount(o: Order): number {
  return o.shops.reduce((n, s) => n + s.items.reduce((m, i) => m + i.qty, 0), 0);
}

/**
 * Where the parcel is on its trip, 0 (at the seller's hub) to 1 (at your door),
 * plus when it's due. Null before it ships or once it's been delivered.
 */
export function routeProgress(o: Order, now: number): { progress: number; outForDelivery: boolean; etaMs: number } | null {
  if (o.cancelledAt || o.receivedAt) return null;
  const s = steps(o);
  const shipped = o.createdAt + s.find((x) => x.title === 'Parcel has been shipped out')!.at;
  const out = o.createdAt + s.find((x) => x.title === 'Out for delivery')!.at;
  const done = deliveredAt(o);
  if (now < shipped || now >= done) return null;
  const progress = now < out ? ((now - shipped) / (out - shipped)) * 0.5 : 0.5 + ((now - out) / (done - out)) * 0.5;
  return { progress, outForDelivery: now >= out, etaMs: done - now };
}
