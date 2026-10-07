import type { IconName } from '../components/Icon';
import { keptInWallet, streak, useShop } from '../store/useShop';

type S = ReturnType<typeof useShop.getState>;

export type Achievement = { id: string; title: string; desc: string; icon: IconName; color: string; test: (s: S) => boolean };

const orders = (s: S) => s.orders.filter((o) => !o.cancelledAt);

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_order', title: 'First Haul', desc: 'Place your first pretend order', icon: 'bag-check', color: '#F43F5E', test: (s) => orders(s).length >= 1 },
  { id: 'suki', title: 'Suki', desc: 'Place 5 orders', icon: 'repeat', color: '#FB7A3C', test: (s) => orders(s).length >= 5 },
  { id: 'big_order', title: 'Big Pretender', desc: 'One order worth ₱10,000 or more', icon: 'diamond', color: '#7C3AED', test: (s) => orders(s).some((o) => o.total >= 10000) },
  { id: 'kept_10k', title: '₱10K Kept', desc: 'Keep ₱10,000 in your wallet', icon: 'wallet', color: '#16A34A', test: (s) => keptInWallet(s.orders) >= 10000 },
  { id: 'kept_50k', title: 'Half-a-Lakh Saver', desc: 'Keep ₱50,000 in your wallet', icon: 'trophy', color: '#CA8A04', test: (s) => keptInWallet(s.orders) >= 50000 },
  { id: 'unboxer', title: 'Unboxer', desc: 'Open your first parcel', icon: 'cube', color: '#B45309', test: (s) => s.orders.some((o) => o.receivedAt) },
  { id: 'critic', title: 'The Critic', desc: 'Rate 5 items', icon: 'star', color: '#EAB308', test: (s) => s.reviews.length >= 5 },
  { id: 'streak7', title: 'Seven Straight', desc: 'Check in 7 days in a row', icon: 'flame', color: '#EA580C', test: (s) => streak(s.checkins) >= 7 },
  { id: 'slasher', title: 'Slashed to ₱0', desc: 'Win a Slash It prize', icon: 'cut', color: '#E11D48', test: (s) => s.orders.some((o) => o.slash) },
  { id: 'squad', title: 'Squad Goals', desc: 'Complete a group buy', icon: 'people', color: '#0D9488', test: (s) => s.orders.some((o) => o.group) },
  { id: 'gifter', title: 'Gift Giver', desc: 'Send a gift', icon: 'gift', color: '#DB2777', test: (s) => s.orders.some((o) => o.gift) },
  { id: 'mega', title: 'Mega Day Survivor', desc: 'Order during a mega sale day', icon: 'sparkles', color: '#A855F7', test: (s) => s.orders.some((o) => o.mega) },
  { id: 'spinner', title: 'Lucky Spinner', desc: 'Spin the wheel 10 times', icon: 'sync-circle', color: '#6366F1', test: (s) => (s.stats.spins ?? 0) >= 10 },
  { id: 'gardener', title: 'Green Thumb', desc: 'Harvest your first plant', icon: 'leaf', color: '#22C55E', test: (s) => s.farm.harvests >= 1 },
  { id: 'iron_will', title: 'Iron Will', desc: 'Change your mind on a cart item', icon: 'shield-checkmark', color: '#0EA5E9', test: (s) => s.resisted.length >= 1 },
  { id: 'patience', title: 'Worth the Wait', desc: 'Check out after a cool-off', icon: 'hourglass', color: '#64748B', test: (s) => (s.stats.patience ?? 0) >= 1 },
  { id: 'live', title: 'Mine!', desc: 'Grab an item from a live stream', icon: 'videocam', color: '#F97316', test: (s) => (s.stats.liveMine ?? 0) >= 1 },
  { id: 'scroller', title: 'Doomscroller', desc: 'Like 10 videos in the Feed', icon: 'play-circle', color: '#EC4899', test: (s) => s.feedLikes.length >= 10 },
  { id: 'chatty', title: 'Chika Champ', desc: 'Chat with 3 sellers', icon: 'chatbubbles', color: '#14B8A6', test: (s) => Object.values(s.chats).filter((m) => m.length).length >= 3 },
  { id: 'goal', title: 'Goal Getter', desc: 'Reach your savings goal', icon: 'flag', color: '#F59E0B', test: (s) => !!s.goal?.reachedAt },
  { id: 'coin_shopper', title: 'Coin Collector', desc: 'Redeem something in the Coins Shop', icon: 'storefront', color: '#D97706', test: (s) => (s.stats.coinRedeems ?? 0) >= 1 },
];

export function newlyUnlocked(s: S): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && a.test(s));
}
