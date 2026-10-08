import { describe, expect, it } from 'vitest';
import { PRODUCTS, Product, getShop } from '../data/catalog';
import { FREE_SHIP_MIN, VOUCHERS, bundleFor, shopVoucher } from '../data/promos';
import { EXPRESS_FEE, Line, baseShipping, computeCheckout, groupByShop, voucherEligible } from './checkout';

// Fixed clocks: an ordinary day, and the 10.10 mega sale day.
const NORMAL = new Date(2026, 9, 7, 12).getTime();
const MEGA = new Date(2026, 9, 10, 12).getTime();

const voucher = (id: string) => VOUCHERS.find((v) => v.id === id)!;

function line(p: Product, unitPrice: number, qty = 1): Line {
  return { key: `${p.id}|`, productId: p.id, variant: {}, qty, unitPrice, unitOriginal: unitPrice * 2 };
}

const find = (test: (p: Product) => boolean) => {
  const p = PRODUCTS.find(test);
  if (!p) throw new Error('no product matches the test fixture');
  return p;
};

// A small shop item with no free shipping, from a non-Mall shop.
const plain = find((p) => !p.freeShipping && !getShop(p.shopId).mall && !bundleFor(p));
const freeShip = find((p) => p.freeShipping);
const bundled = find((p) => !!bundleFor(p) && !p.freeShipping && !getShop(p.shopId).mall);

const base = { voucher: null, useCoins: false, coins: 0, express: {}, shopVouchers: [] as string[], now: NORMAL };

describe('groupByShop', () => {
  it('charges base shipping when nothing qualifies for free shipping', () => {
    const [g] = groupByShop([line(plain, 100)], { now: NORMAL });
    expect(g.shippingFee).toBe(baseShipping(g.shop));
    expect(g.shippingDiscount).toBe(0);
    expect(g.freeShip).toBeNull();
    expect(g.freeShipGap).toBe(FREE_SHIP_MIN - 100);
  });

  it('waives shipping when a free-shipping item is in the shop', () => {
    const [g] = groupByShop([line(freeShip, 100)], { now: NORMAL });
    expect(g.freeShip).toBe('item');
    expect(g.shippingDiscount).toBe(baseShipping(g.shop));
  });

  it('waives shipping once the shop subtotal reaches the threshold', () => {
    const [g] = groupByShop([line(plain, FREE_SHIP_MIN)], { now: NORMAL });
    expect(g.freeShip).toBe('threshold');
    expect(g.freeShipGap).toBe(0);
  });

  it('waives shipping for everything on a mega day', () => {
    const [g] = groupByShop([line(plain, 100)], { now: MEGA });
    expect(g.freeShip).toBe('mega');
  });

  it('adds the express fee but only waives the base fee', () => {
    const [g] = groupByShop([line(freeShip, 100)], { now: NORMAL, express: { [freeShip.shopId]: true } });
    expect(g.shippingFee).toBe(baseShipping(g.shop) + EXPRESS_FEE);
    expect(g.shippingFee - g.shippingDiscount).toBe(EXPRESS_FEE);
  });

  it('applies bundle discounts per line by quantity', () => {
    const one = groupByShop([line(bundled, 200, 1)], { now: NORMAL })[0];
    const two = groupByShop([line(bundled, 200, 2)], { now: NORMAL })[0];
    const three = groupByShop([line(bundled, 200, 3)], { now: NORMAL })[0];
    expect(one.bundleDiscount).toBe(0);
    expect(two.bundleDiscount).toBe(20); // 5% of 400
    expect(three.bundleDiscount).toBe(60); // 10% of 600
    expect(three.subtotal).toBe(540);
  });

  it('applies a claimed shop voucher only above its minimum spend', () => {
    const v = shopVoucher(getShop(plain.shopId));
    const below = groupByShop([line(plain, v.minSpend - 1)], { now: NORMAL, shopVouchers: [plain.shopId] })[0];
    const at = groupByShop([line(plain, v.minSpend)], { now: NORMAL, shopVouchers: [plain.shopId] })[0];
    const unclaimed = groupByShop([line(plain, v.minSpend)], { now: NORMAL })[0];
    expect(below.shopVoucherDiscount).toBe(0);
    expect(at.shopVoucherDiscount).toBe(v.value);
    expect(unclaimed.shopVoucherDiscount).toBe(0);
  });

  it('groups lines from different shops separately', () => {
    const other = find((p) => p.shopId !== plain.shopId);
    expect(groupByShop([line(plain, 100), line(other, 100)], { now: NORMAL })).toHaveLength(2);
  });
});

describe('computeCheckout', () => {
  it('adds merchandise and shipping into the total', () => {
    const s = computeCheckout([line(plain, 150, 2)], base);
    const fee = baseShipping(getShop(plain.shopId));
    expect(s.subtotal).toBe(300);
    expect(s.total).toBe(300 + fee);
    expect(s.saved).toBe(300); // originals were set to double the price
  });

  it('takes a fixed voucher off when the minimum spend is met', () => {
    const s = computeCheckout([line(plain, 400)], { ...base, voucher: voucher('WELCOME100') });
    expect(s.voucher?.id).toBe('WELCOME100');
    expect(s.voucherDiscount).toBe(100);
  });

  it('ignores a voucher below its minimum spend', () => {
    const s = computeCheckout([line(plain, 100)], { ...base, voucher: voucher('WELCOME100') });
    expect(s.voucher).toBeNull();
    expect(s.voucherDiscount).toBe(0);
  });

  it('caps percent vouchers', () => {
    const v = voucher('PABILI15'); // 15%, capped at ₱250, min ₱999
    const small = computeCheckout([line(plain, 1000)], { ...base, voucher: v });
    const big = computeCheckout([line(plain, 5000)], { ...base, voucher: v });
    expect(small.voucherDiscount).toBe(150);
    expect(big.voucherDiscount).toBe(v.cap);
  });

  it('puts shipping vouchers against shipping, never below zero', () => {
    const s = computeCheckout([line(plain, 100)], { ...base, voucher: voucher('FREESHIP') });
    expect(s.voucherDiscount).toBe(0);
    expect(s.shippingDiscount).toBe(Math.min(voucher('FREESHIP').value, s.shippingTotal));
    expect(s.total).toBe(100 + s.shippingTotal - s.shippingDiscount);
  });

  it('only allows mega-day vouchers on a mega day', () => {
    const v = voucher('MEGADAY');
    expect(voucherEligible(v, 5000, NORMAL)).toBe(false);
    expect(voucherEligible(v, 5000, MEGA)).toBe(true);
    expect(computeCheckout([line(plain, 5000)], { ...base, voucher: v }).voucherDiscount).toBe(0);
    expect(computeCheckout([line(plain, 5000)], { ...base, voucher: v, now: MEGA }).voucherDiscount).toBe(v.value);
  });

  it('checks voucher minimums after shop vouchers are taken off', () => {
    const sv = shopVoucher(getShop(plain.shopId));
    const price = 300 + sv.value - 1; // just short of WELCOME100's ₱300 once the shop voucher applies
    const s = computeCheckout([line(plain, price)], { ...base, voucher: voucher('WELCOME100'), shopVouchers: [plain.shopId] });
    expect(s.shopVoucherDiscount).toBe(sv.value);
    expect(s.voucher).toBeNull();
  });

  it('redeems coins up to half the total and no more than you have', () => {
    const fee = baseShipping(getShop(plain.shopId));
    const lots = computeCheckout([line(plain, 400)], { ...base, useCoins: true, coins: 10_000 });
    expect(lots.coinsUsed).toBe(Math.floor((400 + fee) * 0.5));
    const few = computeCheckout([line(plain, 400)], { ...base, useCoins: true, coins: 30 });
    expect(few.coinsUsed).toBe(30);
    expect(few.total).toBe(400 + fee - 30);
    const off = computeCheckout([line(plain, 400)], { ...base, useCoins: false, coins: 10_000 });
    expect(off.coinsUsed).toBe(0);
  });

  it('earns 2% back in coins, at least 1, doubled on mega days', () => {
    const normal = computeCheckout([line(plain, 1000)], base);
    expect(normal.coinsEarned).toBe(Math.floor(normal.total * 0.02));
    expect(computeCheckout([line(plain, 10)], base).coinsEarned).toBe(1);
    const mega = computeCheckout([line(plain, 1000)], { ...base, now: MEGA });
    expect(mega.coinsEarned).toBe(Math.floor(mega.total * 0.02) * 2);
  });

  it('makes a Slash It prize completely free, shipping included', () => {
    const s = computeCheckout([line(plain, 0)], { ...base, freeShipping: true });
    expect(s.shippingDiscount).toBe(s.shippingTotal);
    expect(s.total).toBe(0);
  });

  it('never lets the total go negative', () => {
    const s = computeCheckout([line(plain, 50)], { ...base, voucher: voucher('LATE50'), useCoins: true, coins: 1000 });
    expect(s.total).toBeGreaterThanOrEqual(0);
  });
});
