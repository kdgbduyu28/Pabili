import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { variantLabel } from '../data/catalog';
import { CheckoutSummary, Line } from '../lib/checkout';
import { todayKey } from '../lib/format';

export type CartItem = Line & { selected: boolean; addedAt: number };

export type Address = { name: string; phone: string; line1: string; city: string };

export type OrderShop = {
  shopId: string;
  shippingFee: number;
  shippingDiscount: number;
  bundleDiscount: number;
  shopVoucherDiscount: number;
  express: boolean;
  message: string;
  items: (Line & { label: string })[];
};

export type Order = {
  id: string;
  createdAt: number;
  shops: OrderShop[];
  subtotal: number;
  shippingTotal: number;
  shippingDiscount: number;
  voucherId: string | null;
  voucherDiscount: number;
  coinsUsed: number;
  coinsEarned: number;
  total: number;
  saved: number;
  payment: string;
  address: Address;
  /** Set when the parcel is unboxed, which also completes the order. */
  receivedAt?: number;
  cancelledAt?: number;
  returnedAt?: number;
  returnReason?: string;
  /** Slash It wins arrive as free orders. */
  slash?: boolean;
  group?: boolean;
  gift?: Gift;
  /** Placed while a mega day was live (for achievements and Wrapped). */
  mega?: boolean;
};

export type Gift = { to: string; message: string; wrap: string };

export type Review = {
  /** `${orderId}|${lineKey}`: one review per bought line. */
  key: string;
  orderId: string;
  productId: string;
  rating: number;
  tags: string[];
  text: string;
  variant: string;
  createdAt: number;
};

export type SlashCut = { name: string; amount: number; at: number };

export type Slash = {
  productId: string;
  /** Price when the slash started; reaching 0 wins the item. */
  start: number;
  startedAt: number;
  cuts: SlashCut[];
  invites: number;
  claimedAt?: number;
};

export type ChatMsg = { id: string; from: 'me' | 'shop'; text: string; at: number; productId?: string };

export type Goal = { name: string; amount: number; reachedAt?: number };

type DailyCount = { day: string; used: number };

export type GroupBuy = {
  productId: string;
  price: number;
  size: number;
  startedAt: number;
  members: { name: string; at: number }[];
  claimedAt?: number;
};

export type Farm = { plant: number; points: number; water: DailyCount; harvests: number };

export type Question = { id: string; q: string; a?: string; by: string; at: number; mine?: boolean };

export type Resisted = { productId: string; amount: number; at: number };

export type ThemePref = 'system' | 'light' | 'dark';

export type Settings = { sound: boolean; coolOff: boolean; coolOffMins: number; theme: ThemePref; notifications: boolean };

type State = {
  cart: CartItem[];
  likes: string[];
  orders: Order[];
  claimed: string[];
  usedVouchers: string[];
  shopVouchers: string[];
  coins: number;
  checkins: string[];
  address: Address;
  recent: string[];
  viewed: string[];
  reviews: Review[];
  notifSeenAt: number;
  lateGranted: string[];
  spins: DailyCount;
  shakes: DailyCount;
  slash: Slash | null;
  chats: Record<string, ChatMsg[]>;
  goal: Goal | null;
  followed: string[];
  restockAlerts: string[];
  group: GroupBuy | null;
  farm: Farm;
  questions: Record<string, Question[]>;
  /** null until onboarding has run. */
  interests: string[] | null;
  achievements: Record<string, number>;
  resisted: Resisted[];
  settings: Settings;
  feedLikes: string[];
  stats: Record<string, number>;
  // Not persisted: what the checkout screen is about to buy.
  draft: { lines: Line[]; fromCart: boolean; slash?: boolean; group?: boolean } | null;

  addToCart: (line: Omit<Line, 'key'>) => void;
  setQty: (key: string, qty: number) => void;
  toggleSelected: (key: string) => void;
  setSelected: (keys: string[], selected: boolean) => void;
  removeFromCart: (keys: string[]) => void;
  toggleLike: (productId: string) => void;
  claimVoucher: (id: string) => void;
  claimShopVoucher: (shopId: string) => void;
  addCoins: (n: number) => void;
  checkIn: () => number;
  setAddress: (a: Address) => void;
  addRecent: (q: string) => void;
  clearRecent: () => void;
  viewProduct: (id: string) => void;
  startCheckout: (lines: Line[], fromCart: boolean, kind?: { slash?: boolean; group?: boolean }) => void;
  placeOrder: (s: CheckoutSummary, extra: { payment: string; messages: Record<string, string>; gift?: Gift }) => Order;
  receiveOrder: (id: string) => void;
  cancelOrder: (id: string) => void;
  returnOrder: (id: string, reason: string) => void;
  addReviews: (rs: Review[]) => number;
  markNotificationsSeen: () => void;
  grantLateVoucher: (orderId: string) => void;
  countDaily: (kind: 'spins' | 'shakes', limit: number) => boolean;
  startSlash: (productId: string, price: number, firstCut: SlashCut) => void;
  inviteToSlash: (cuts: SlashCut[]) => void;
  claimSlash: () => void;
  sendChat: (shopId: string, msg: ChatMsg) => void;
  setGoal: (g: Goal | null) => void;
  markGoalReached: () => void;
  spendCoins: (n: number) => boolean;
  toggleFollow: (shopId: string) => boolean;
  toggleRestock: (productId: string) => boolean;
  startGroup: (g: GroupBuy) => void;
  addGroupMembers: (members: { name: string; at: number }[]) => void;
  setFarm: (f: Farm) => void;
  askQuestion: (productId: string, q: Question) => void;
  answerQuestion: (productId: string, id: string, a: string) => void;
  setInterests: (ids: string[]) => void;
  unlockAchievements: (ids: string[]) => void;
  resist: (keys: string[]) => number;
  setSettings: (s: Partial<Settings>) => void;
  toggleFeedLike: (clipId: string) => boolean;
  bumpStat: (name: string, n?: number) => void;
  resetAll: () => void;
};

export const DEFAULT_ADDRESS: Address = {
  name: 'Juan Dela Cruz',
  phone: '(+63) 917 000 0000',
  line1: 'Unit 10, Imaginary Tower, 123 Wishlist St., Brgy. Pangarap',
  city: 'Quezon City, Metro Manila',
};

const initial = {
  cart: [] as CartItem[],
  likes: [] as string[],
  orders: [] as Order[],
  claimed: ['WELCOME100'],
  usedVouchers: [] as string[],
  shopVouchers: [] as string[],
  coins: 50,
  checkins: [] as string[],
  address: DEFAULT_ADDRESS,
  recent: [] as string[],
  viewed: [] as string[],
  reviews: [] as Review[],
  notifSeenAt: 0,
  lateGranted: [] as string[],
  spins: { day: '', used: 0 },
  shakes: { day: '', used: 0 },
  slash: null as Slash | null,
  chats: {} as Record<string, ChatMsg[]>,
  goal: null as Goal | null,
  followed: [] as string[],
  restockAlerts: [] as string[],
  group: null as GroupBuy | null,
  farm: { plant: 0, points: 0, water: { day: '', used: 0 }, harvests: 0 } as Farm,
  questions: {} as Record<string, Question[]>,
  interests: null as string[] | null,
  achievements: {} as Record<string, number>,
  resisted: [] as Resisted[],
  settings: { sound: true, coolOff: false, coolOffMins: 10, theme: 'system', notifications: true } as Settings,
  feedLikes: [] as string[],
  stats: {} as Record<string, number>,
  draft: null,
};

export const CHECKIN_REWARDS = [5, 5, 10, 5, 5, 10, 25];
export const COINS_PER_REVIEW = 5;

function lineKey(productId: string, variant: Record<string, string>) {
  return `${productId}|${variantLabel(variant)}`;
}

export const useShop = create<State>()(
  persist(
    (set, get) => ({
      ...initial,

      addToCart: (line) =>
        set((s) => {
          const key = lineKey(line.productId, line.variant);
          const existing = s.cart.find((c) => c.key === key);
          if (existing) {
            return {
              cart: s.cart.map((c) =>
                c.key === key
                  ? { ...c, qty: c.qty + line.qty, unitPrice: Math.min(c.unitPrice, line.unitPrice), selected: true }
                  : c,
              ),
            };
          }
          return { cart: [{ ...line, key, selected: true, addedAt: Date.now() }, ...s.cart] };
        }),

      setQty: (key, qty) => set((s) => ({ cart: s.cart.map((c) => (c.key === key ? { ...c, qty: Math.max(1, qty) } : c)) })),

      toggleSelected: (key) =>
        set((s) => ({ cart: s.cart.map((c) => (c.key === key ? { ...c, selected: !c.selected } : c)) })),

      setSelected: (keys, selected) =>
        set((s) => ({ cart: s.cart.map((c) => (keys.includes(c.key) ? { ...c, selected } : c)) })),

      removeFromCart: (keys) => set((s) => ({ cart: s.cart.filter((c) => !keys.includes(c.key)) })),

      toggleLike: (id) =>
        set((s) => ({ likes: s.likes.includes(id) ? s.likes.filter((x) => x !== id) : [id, ...s.likes] })),

      claimVoucher: (id) => set((s) => (s.claimed.includes(id) ? s : { claimed: [...s.claimed, id] })),

      claimShopVoucher: (shopId) =>
        set((s) => (s.shopVouchers.includes(shopId) ? s : { shopVouchers: [...s.shopVouchers, shopId] })),

      addCoins: (n) => set((s) => ({ coins: Math.max(0, s.coins + n) })),

      checkIn: () => {
        const s = get();
        const today = todayKey();
        if (s.checkins.includes(today)) return 0;
        const reward = CHECKIN_REWARDS[streak(s.checkins) % CHECKIN_REWARDS.length];
        set({ checkins: [...s.checkins, today].slice(-30), coins: s.coins + reward });
        return reward;
      },

      setAddress: (address) => set({ address }),

      addRecent: (q) =>
        set((s) => {
          const t = q.trim();
          if (!t) return s;
          return { recent: [t, ...s.recent.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8) };
        }),

      clearRecent: () => set({ recent: [] }),

      viewProduct: (id) => set((s) => ({ viewed: [id, ...s.viewed.filter((x) => x !== id)].slice(0, 20) })),

      startCheckout: (lines, fromCart, kind = {}) => set({ draft: { lines, fromCart, ...kind } }),

      placeOrder: (sum, { payment, messages, gift }) => {
        const s = get();
        const order: Order = {
          id: `PB${Date.now().toString(36).toUpperCase()}`,
          createdAt: Date.now(),
          shops: sum.groups.map((g) => ({
            shopId: g.shop.id,
            shippingFee: g.shippingFee,
            shippingDiscount: g.shippingDiscount,
            bundleDiscount: g.bundleDiscount,
            shopVoucherDiscount: g.shopVoucherDiscount,
            express: g.express,
            message: messages[g.shop.id] ?? '',
            items: g.lines.map(({ product, bundlePct: _b, ...l }) => ({ ...l, label: product.title })),
          })),
          subtotal: sum.subtotal,
          shippingTotal: sum.shippingTotal,
          shippingDiscount: sum.shippingDiscount,
          voucherId: sum.voucher?.id ?? null,
          voucherDiscount: sum.voucherDiscount,
          coinsUsed: sum.coinsUsed,
          coinsEarned: sum.coinsEarned,
          total: sum.total,
          saved: sum.saved,
          payment,
          address: s.address,
          slash: s.draft?.slash,
          group: s.draft?.group,
          gift,
          mega: sum.megaLive,
        };
        const boughtKeys = s.draft?.fromCart ? s.draft.lines.map((l) => l.key) : [];
        const usedShopVouchers = sum.groups.filter((g) => g.shopVoucherDiscount > 0).map((g) => g.shop.id);
        // Vouchers are single-use. WELCOME100 can only ever be claimed once.
        const voucherId = sum.voucher?.id;
        set({
          orders: [order, ...s.orders],
          cart: s.cart.filter((c) => !boughtKeys.includes(c.key)),
          coins: s.coins - sum.coinsUsed + sum.coinsEarned,
          claimed: voucherId ? s.claimed.filter((v) => v !== voucherId) : s.claimed,
          usedVouchers: voucherId === 'WELCOME100' ? [...s.usedVouchers, voucherId] : s.usedVouchers,
          shopVouchers: s.shopVouchers.filter((id) => !usedShopVouchers.includes(id)),
          slash: s.draft?.slash && s.slash ? { ...s.slash, claimedAt: Date.now() } : s.slash,
          group: s.draft?.group && s.group ? { ...s.group, claimedAt: Date.now() } : s.group,
          draft: null,
        });
        return order;
      },

      receiveOrder: (id) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id && !o.receivedAt ? { ...o, receivedAt: Date.now() } : o)) })),

      cancelOrder: (id) =>
        set((s) => {
          const o = s.orders.find((x) => x.id === id);
          if (!o || o.cancelledAt) return s;
          return {
            orders: s.orders.map((x) => (x.id === id ? { ...x, cancelledAt: Date.now() } : x)),
            coins: Math.max(0, s.coins + o.coinsUsed - o.coinsEarned),
          };
        }),

      returnOrder: (id, reason) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, returnedAt: Date.now(), returnReason: reason } : o)),
        })),

      addReviews: (rs) => {
        const s = get();
        const fresh = rs.filter((r) => !s.reviews.some((x) => x.key === r.key));
        const coins = fresh.length * COINS_PER_REVIEW;
        set({ reviews: [...fresh, ...s.reviews], coins: s.coins + coins });
        return coins;
      },

      markNotificationsSeen: () => set({ notifSeenAt: Date.now() }),

      grantLateVoucher: (orderId) =>
        set((s) =>
          s.lateGranted.includes(orderId)
            ? s
            : {
                lateGranted: [...s.lateGranted, orderId],
                claimed: s.claimed.includes('LATE50') ? s.claimed : [...s.claimed, 'LATE50'],
              },
        ),

      countDaily: (kind, limit) => {
        const s = get();
        const today = todayKey();
        const cur = s[kind].day === today ? s[kind] : { day: today, used: 0 };
        if (cur.used >= limit) return false;
        set({ [kind]: { day: today, used: cur.used + 1 } } as Pick<State, typeof kind>);
        return true;
      },

      startSlash: (productId, price, firstCut) =>
        set({ slash: { productId, start: price, startedAt: Date.now(), cuts: [firstCut], invites: 0 } }),

      inviteToSlash: (cuts) =>
        set((s) => (s.slash ? { slash: { ...s.slash, invites: s.slash.invites + 1, cuts: [...s.slash.cuts, ...cuts] } } : s)),

      claimSlash: () => set((s) => (s.slash ? { slash: { ...s.slash, claimedAt: Date.now() } } : s)),

      sendChat: (shopId, msg) => set((s) => ({ chats: { ...s.chats, [shopId]: [...(s.chats[shopId] ?? []), msg] } })),

      setGoal: (goal) => set({ goal }),

      markGoalReached: () => set((s) => (s.goal && !s.goal.reachedAt ? { goal: { ...s.goal, reachedAt: Date.now() } } : s)),

      spendCoins: (n) => {
        if (get().coins < n) return false;
        set((s) => ({ coins: s.coins - n }));
        return true;
      },

      toggleFollow: (shopId) => {
        const on = !get().followed.includes(shopId);
        set((s) => ({ followed: on ? [shopId, ...s.followed] : s.followed.filter((x) => x !== shopId) }));
        return on;
      },

      toggleRestock: (productId) => {
        const on = !get().restockAlerts.includes(productId);
        set((s) => ({ restockAlerts: on ? [...s.restockAlerts, productId] : s.restockAlerts.filter((x) => x !== productId) }));
        return on;
      },

      startGroup: (group) => set({ group }),

      addGroupMembers: (members) => set((s) => (s.group ? { group: { ...s.group, members: [...s.group.members, ...members] } } : s)),

      setFarm: (farm) => set({ farm }),

      askQuestion: (productId, q) =>
        set((s) => ({ questions: { ...s.questions, [productId]: [q, ...(s.questions[productId] ?? [])] } })),

      answerQuestion: (productId, id, a) =>
        set((s) => ({
          questions: { ...s.questions, [productId]: (s.questions[productId] ?? []).map((q) => (q.id === id ? { ...q, a } : q)) },
        })),

      setInterests: (interests) => set({ interests }),

      unlockAchievements: (ids) =>
        set((s) => {
          const now = Date.now();
          const fresh = ids.filter((id) => !s.achievements[id]);
          if (!fresh.length) return s;
          return { achievements: { ...s.achievements, ...Object.fromEntries(fresh.map((id) => [id, now])) } };
        }),

      resist: (keys) => {
        const s = get();
        const items = s.cart.filter((c) => keys.includes(c.key));
        const amount = items.reduce((n, c) => n + c.unitPrice * c.qty, 0);
        set({
          cart: s.cart.filter((c) => !keys.includes(c.key)),
          resisted: [...items.map((c) => ({ productId: c.productId, amount: c.unitPrice * c.qty, at: Date.now() })), ...s.resisted],
        });
        return amount;
      },

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      toggleFeedLike: (clipId) => {
        const on = !get().feedLikes.includes(clipId);
        set((s) => ({ feedLikes: on ? [clipId, ...s.feedLikes] : s.feedLikes.filter((x) => x !== clipId) }));
        return on;
      },

      bumpStat: (name, n = 1) => set((s) => ({ stats: { ...s.stats, [name]: (s.stats[name] ?? 0) + n } })),

      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'pabili-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // The default shallow merge also gives fields added after v1 their initial values.
      partialize: ({ draft, ...rest }) => rest,
    },
  ),
);

/** Consecutive days checked in, ending today or yesterday. */
export function streak(checkins: string[]): number {
  const set = new Set(checkins);
  const d = new Date();
  if (!set.has(todayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(todayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const cartCount = (s: State) => s.cart.length;

/** Pretend money not spent: every order that wasn't cancelled. Returns still count. */
export function keptInWallet(orders: Order[]): number {
  return orders.filter((o) => !o.cancelledAt).reduce((n, o) => n + o.total, 0);
}
