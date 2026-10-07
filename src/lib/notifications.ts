import { Product, getProduct } from '../data/catalog';
import { flashDeals, megaInfo, slotStart, unitPrice } from '../data/promos';
import type { CartItem, Farm, GroupBuy, Order, Review, Slash } from '../store/useShop';
import { restockAt } from '../data/extras';
import { C } from '../theme';
import type { IconName } from '../components/Icon';
import { peso, todayKey } from './format';
import { timeline } from './orders';

export type NotifKind = 'order' | 'deal' | 'coins';

export type Notif = {
  id: string;
  kind: NotifKind;
  icon: IconName | 'coin';
  tint: string;
  title: string;
  body: string;
  at: number;
  href: string;
  product?: Product;
};

type Input = {
  orders: Order[];
  cart: CartItem[];
  likes: string[];
  checkins: string[];
  reviews: Review[];
  slash: Slash | null;
  restockAlerts: string[];
  group: GroupBuy | null;
  farm: Farm;
};

const ORDER_STEP: Record<string, { title: string; icon: IconName; tint: string } | undefined> = {
  'Order placed': { title: 'Order placed', icon: 'receipt', tint: C.primary },
  'Parcel has been shipped out': { title: 'Shipped out', icon: 'cube', tint: C.ship },
  'Delivery delayed': { title: 'Parcel delayed, ₱50 voucher added', icon: 'time', tint: C.preferred },
  'Out for delivery': { title: 'Out for delivery', icon: 'bicycle', tint: C.ship },
  'Parcel delivered': { title: 'Parcel delivered! Tap to unbox', icon: 'gift', tint: C.primary },
};

function startOfDay(now: number) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Notifications are derived from state on every render instead of stored, so
 * they can't drift from the orders and prices they describe.
 */
export function buildNotifications(s: Input, now: number): Notif[] {
  const out: Notif[] = [];
  const today = startOfDay(now);

  for (const o of s.orders) {
    if (o.cancelledAt) continue;
    const first = o.shops[0]?.items[0];
    const product = first ? getProduct(first.productId) : undefined;
    for (const step of timeline(o, now)) {
      const meta = ORDER_STEP[step.title];
      if (!meta) continue;
      const delivered = step.title === 'Parcel delivered';
      out.push({
        id: `o:${o.id}:${step.title}`,
        kind: 'order',
        icon: meta.icon,
        tint: meta.tint,
        title: delivered && o.receivedAt ? 'Parcel delivered' : meta.title,
        body:
          step.title === 'Order placed'
            ? `Order ${o.id} confirmed. ${peso(o.total)} stays in your wallet.`
            : `${step.detail}. Order ${o.id}.`,
        at: step.at,
        href: delivered && !o.receivedAt ? `/unbox/${o.id}` : `/order/${o.id}`,
        product,
      });
    }
    if (o.receivedAt && !o.returnedAt) {
      const lines = o.shops.flatMap((sh) => sh.items);
      const unrated = lines.filter((l) => !s.reviews.some((r) => r.key === `${o.id}|${l.key}`)).length;
      if (unrated) {
        out.push({
          id: `rate:${o.id}`,
          kind: 'coins',
          icon: 'coin',
          tint: C.coin,
          title: `Rate your items, earn ${unrated * 5} coins`,
          body: 'Tell other pretend shoppers what you think.',
          at: o.receivedAt + 1,
          href: `/rate/${o.id}`,
          product,
        });
      }
    }
  }

  for (const c of s.cart) {
    const p = getProduct(c.productId);
    if (!p) continue;
    const now$ = unitPrice(p, c.variant, now).price;
    if (now$ < c.unitPrice) {
      out.push({
        id: `drop:${c.key}:${todayKey(new Date(now))}:${now$}`,
        kind: 'deal',
        icon: 'trending-down',
        tint: C.success,
        title: `Price drop on an item in your cart`,
        body: `${p.name} is now ${peso(now$)} (was ${peso(c.unitPrice)}).`,
        at: Math.max(today, slotStart(now), c.addedAt + 1),
        href: '/cart',
        product: p,
      });
    }
  }

  const slot = slotStart(now);
  for (const d of flashDeals(slot)) {
    if (!s.likes.includes(d.product.id)) continue;
    out.push({
      id: `likeflash:${slot}:${d.product.id}`,
      kind: 'deal',
      icon: 'flash',
      tint: C.primary,
      title: 'A liked item is on Flash Sale',
      body: `${d.product.name} is ${peso(d.flashPrice)} until the slot ends.`,
      at: slot,
      href: `/product/${d.product.id}`,
      product: d.product,
    });
  }

  const mega = megaInfo(now);
  const days = Math.ceil((mega.start - now) / 86400000);
  if (mega.live) {
    out.push({
      id: `mega:${mega.start}:live`,
      kind: 'deal',
      icon: 'sparkles',
      tint: C.primary,
      title: `${mega.label} Mega Sale is LIVE`,
      body: 'Free shipping on everything, 2x coins and Mega Day vouchers. Today only!',
      at: mega.start,
      href: '/mega',
    });
  } else if (days <= 7) {
    out.push({
      id: `mega:${mega.start}:${days}`,
      kind: 'deal',
      icon: 'calendar',
      tint: C.preferred,
      title: `${mega.label} is ${days === 1 ? 'tomorrow' : `in ${days} days`}`,
      body: 'Add to cart now so you are ready when vouchers drop at midnight.',
      at: today,
      href: '/mega',
    });
  }

  if (!s.checkins.includes(todayKey(new Date(now)))) {
    out.push({
      id: `checkin:${todayKey(new Date(now))}`,
      kind: 'coins',
      icon: 'coin',
      tint: C.coin,
      title: 'Your daily coins are waiting',
      body: 'Check in today to keep your streak going.',
      at: today,
      href: '/me',
    });
  }

  if (s.slash && !s.slash.claimedAt) {
    for (const cut of s.slash.cuts) {
      if (cut.name === 'You' || cut.at > now) continue;
      out.push({
        id: `slash:${s.slash.startedAt}:${cut.at}`,
        kind: 'deal',
        icon: 'cut',
        tint: C.primary,
        title: `${cut.name} helped you slash ${peso(cut.amount)}`,
        body: 'Keep inviting friends to get it for free.',
        at: cut.at,
        href: '/slash',
        product: getProduct(s.slash.productId),
      });
    }
  }

  for (const id of s.restockAlerts) {
    const p = getProduct(id);
    const at = p ? restockAt(p, now) : null;
    if (!p || at === null || at > now) continue;
    out.push({
      id: `restock:${id}:${at}`,
      kind: 'deal',
      icon: 'refresh-circle',
      tint: C.success,
      title: 'Back in stock!',
      body: `${p.name} is available again. Grab it before it sells out.`,
      at,
      href: `/product/${id}`,
      product: p,
    });
  }

  if (s.group && !s.group.claimedAt) {
    const g = s.group;
    const joined = g.members.filter((m) => m.at <= now);
    for (const m of joined) {
      if (m.name === 'You') continue;
      out.push({
        id: `group:${g.startedAt}:${m.name}`,
        kind: 'deal',
        icon: 'people',
        tint: C.ship,
        title: joined.length >= g.size && m === joined[joined.length - 1] ? 'Your group is complete!' : `${m.name} joined your group`,
        body: joined.length >= g.size ? `Check out now at the group price of ${peso(g.price)}.` : `${g.size - joined.length} more to unlock ${peso(g.price)}.`,
        at: m.at,
        href: '/group',
        product: getProduct(g.productId),
      });
    }
  }

  const waterDay = s.farm.water.day === todayKey(new Date(now)) ? s.farm.water.used : 0;
  if (waterDay === 0 && new Date(now).getHours() >= 9) {
    out.push({
      id: `farm:${todayKey(new Date(now))}`,
      kind: 'coins',
      icon: 'leaf',
      tint: C.success,
      title: 'Your plant is thirsty',
      body: 'Water it today to grow vouchers in your Pabili Garden.',
      at: today + 9 * 3600_000,
      href: '/garden',
    });
  }

  return out.sort((a, b) => b.at - a.at).slice(0, 80);
}
