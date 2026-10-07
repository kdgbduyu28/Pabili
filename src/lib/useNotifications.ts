import { useMemo } from 'react';
import { useShop } from '../store/useShop';
import { useNow } from './hooks';
import { buildNotifications } from './notifications';

export function useNotifications(intervalMs = 5000) {
  const now = useNow(intervalMs);
  const orders = useShop((s) => s.orders);
  const cart = useShop((s) => s.cart);
  const likes = useShop((s) => s.likes);
  const checkins = useShop((s) => s.checkins);
  const reviews = useShop((s) => s.reviews);
  const slash = useShop((s) => s.slash);
  const notifSeenAt = useShop((s) => s.notifSeenAt);
  const restockAlerts = useShop((s) => s.restockAlerts);
  const group = useShop((s) => s.group);
  const farm = useShop((s) => s.farm);
  const list = useMemo(
    () => buildNotifications({ orders, cart, likes, checkins, reviews, slash, restockAlerts, group, farm }, now),
    [orders, cart, likes, checkins, reviews, slash, restockAlerts, group, farm, now],
  );
  return { list, unread: list.filter((n) => n.at > notifSeenAt).length, seenAt: notifSeenAt };
}
