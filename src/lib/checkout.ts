import { Product, Shop, getProduct, getShop } from '../data/catalog';
import { FREE_SHIP_MIN, Voucher, bundlePct, megaInfo, shopVoucher } from '../data/promos';

export type Line = {
  key: string;
  productId: string;
  variant: Record<string, string>;
  qty: number;
  unitPrice: number;
  unitOriginal: number;
};

export type FreeShipReason = 'item' | 'threshold' | 'mega' | null;

export type ShopGroup = {
  shop: Shop;
  lines: (Line & { product: Product; bundlePct: number })[];
  /** Merchandise after bundle deals, before vouchers. */
  subtotal: number;
  bundleDiscount: number;
  shopVoucherDiscount: number;
  shippingFee: number;
  shippingDiscount: number;
  freeShip: FreeShipReason;
  /** How much more to spend in this shop for free shipping (0 when already free). */
  freeShipGap: number;
  express: boolean;
};

export type CheckoutSummary = {
  groups: ShopGroup[];
  itemCount: number;
  subtotal: number;
  originalSubtotal: number;
  bundleDiscount: number;
  shopVoucherDiscount: number;
  shippingTotal: number;
  shippingDiscount: number;
  voucher: Voucher | null;
  voucherDiscount: number;
  coinsUsed: number;
  total: number;
  saved: number;
  coinsEarned: number;
  megaLive: boolean;
};

export const EXPRESS_FEE = 40;

export function baseShipping(shop: Shop): number {
  if (shop.location === 'Metro Manila') return 45;
  if (shop.location === 'Overseas') return 95;
  return 65;
}

export function deliveryDays(shop: Shop, express: boolean): [number, number] {
  if (express) return [1, 2];
  return shop.location === 'Overseas' ? [7, 12] : shop.location === 'Metro Manila' ? [2, 3] : [3, 5];
}

type GroupOpts = { express?: Record<string, boolean>; shopVouchers?: string[]; now?: number };

export function groupByShop(lines: Line[], { express = {}, shopVouchers = [], now = Date.now() }: GroupOpts = {}): ShopGroup[] {
  const megaLive = megaInfo(now).live;
  const map = new Map<string, ShopGroup>();
  for (const line of lines) {
    const product = getProduct(line.productId);
    if (!product) continue;
    let g = map.get(product.shopId);
    if (!g) {
      const shop = getShop(product.shopId);
      g = {
        shop,
        lines: [],
        subtotal: 0,
        bundleDiscount: 0,
        shopVoucherDiscount: 0,
        shippingFee: 0,
        shippingDiscount: 0,
        freeShip: null,
        freeShipGap: 0,
        express: !!express[shop.id],
      };
      map.set(shop.id, g);
    }
    const pct = bundlePct(product, line.qty);
    const gross = line.unitPrice * line.qty;
    const bundle = Math.round((gross * pct) / 100);
    g.lines.push({ ...line, product, bundlePct: pct });
    g.subtotal += gross - bundle;
    g.bundleDiscount += bundle;
  }
  for (const g of map.values()) {
    const base = baseShipping(g.shop);
    g.shippingFee = base + (g.express ? EXPRESS_FEE : 0);
    g.freeShip = megaLive
      ? 'mega'
      : g.lines.some((l) => l.product.freeShipping)
        ? 'item'
        : g.subtotal >= FREE_SHIP_MIN
          ? 'threshold'
          : null;
    g.shippingDiscount = g.freeShip ? base : 0;
    g.freeShipGap = g.freeShip ? 0 : FREE_SHIP_MIN - g.subtotal;
    const sv = shopVoucher(g.shop);
    if (shopVouchers.includes(g.shop.id) && g.subtotal >= sv.minSpend) g.shopVoucherDiscount = sv.value;
  }
  return [...map.values()];
}

export function voucherEligible(v: Voucher, subtotal: number, now = Date.now()) {
  if (v.megaOnly && !megaInfo(now).live) return false;
  return subtotal >= v.minSpend;
}

export function computeCheckout(
  lines: Line[],
  opts: {
    voucher: Voucher | null;
    useCoins: boolean;
    coins: number;
    express: Record<string, boolean>;
    shopVouchers: string[];
    /** Slash It prizes ship free. */
    freeShipping?: boolean;
    now?: number;
  },
): CheckoutSummary {
  const now = opts.now ?? Date.now();
  const megaLive = megaInfo(now).live;
  const groups = groupByShop(lines, { express: opts.express, shopVouchers: opts.shopVouchers, now });
  const sum = (f: (g: ShopGroup) => number) => groups.reduce((s, g) => s + f(g), 0);
  const subtotal = sum((g) => g.subtotal);
  const bundleDiscount = sum((g) => g.bundleDiscount);
  const shopVoucherDiscount = sum((g) => g.shopVoucherDiscount);
  const originalSubtotal = lines.reduce((s, l) => s + l.unitOriginal * l.qty, 0);
  const shippingTotal = sum((g) => g.shippingFee);
  let shippingDiscount = opts.freeShipping ? shippingTotal : sum((g) => g.shippingDiscount);

  const merch = subtotal - shopVoucherDiscount;
  const voucher = opts.voucher && voucherEligible(opts.voucher, merch, now) ? opts.voucher : null;
  let voucherDiscount = 0;
  if (voucher?.kind === 'shipping') {
    shippingDiscount += Math.min(voucher.value, shippingTotal - shippingDiscount);
  } else if (voucher?.kind === 'fixed') {
    voucherDiscount = Math.min(voucher.value, merch);
  } else if (voucher?.kind === 'percent') {
    voucherDiscount = Math.min(voucher.cap ?? Infinity, Math.round((merch * voucher.value) / 100));
  }

  const beforeCoins = merch + shippingTotal - shippingDiscount - voucherDiscount;
  const coinsUsed = opts.useCoins ? Math.min(opts.coins, Math.floor(beforeCoins * 0.5)) : 0;
  const total = beforeCoins - coinsUsed;
  const coinsEarned = Math.max(1, Math.floor(total * 0.02)) * (megaLive ? 2 : 1);

  return {
    groups,
    itemCount: lines.reduce((s, l) => s + l.qty, 0),
    subtotal,
    originalSubtotal,
    bundleDiscount,
    shopVoucherDiscount,
    shippingTotal,
    shippingDiscount,
    voucher,
    voucherDiscount,
    coinsUsed,
    total,
    saved: originalSubtotal - subtotal + shopVoucherDiscount + shippingDiscount + voucherDiscount + coinsUsed,
    coinsEarned,
    megaLive,
  };
}
