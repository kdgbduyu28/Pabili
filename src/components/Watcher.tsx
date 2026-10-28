import { useEffect } from 'react';
import { newlyUnlocked } from '../lib/achievements';
import { play } from '../lib/sound';
import { peso } from '../lib/format';
import { success } from '../lib/haptics';
import { useNow } from '../lib/hooks';
import { isLate, timeline } from '../lib/orders';
import { keptInWallet, useShop } from '../store/useShop';
import { toast } from '../store/useUi';
import { t } from '../i18n';

/** App-wide side effects driven by the clock: late-parcel vouchers and goal milestones. */
export function Watcher() {
  const now = useNow(5000);
  const orders = useShop((s) => s.orders);
  const lateGranted = useShop((s) => s.lateGranted);
  const goal = useShop((s) => s.goal);

  useEffect(() => {
    for (const o of orders) {
      if (o.cancelledAt || !isLate(o) || lateGranted.includes(o.id)) continue;
      if (timeline(o, now).some((s) => s.title === 'Delivery delayed')) {
        useShop.getState().grantLateVoucher(o.id);
        toast('Parcel delayed. Here is ₱50 off your next order.', 'time');
      }
    }
  }, [orders, lateGranted, now]);

  useEffect(() => {
    if (!goal || goal.reachedAt) return;
    if (keptInWallet(orders) >= goal.amount) {
      useShop.getState().markGoalReached();
      success();
      toast(t('Goal reached! {amount} kept for {goal}', { amount: peso(goal.amount), goal: t(goal.name) }), 'trophy');
    }
  }, [orders, goal]);

  // Achievements are checked on every state change, then stored so each one toasts once.
  useEffect(() => {
    const check = () => {
      const s = useShop.getState();
      const fresh = newlyUnlocked(s);
      if (!fresh.length) return;
      s.unlockAchievements(fresh.map((a) => a.id));
      play('tada');
      toast(fresh.length === 1 ? t('Achievement unlocked: {name}', { name: t(fresh[0].title) }) : t('{n} achievements unlocked!', { n: fresh.length }), 'trophy');
    };
    const unsubscribe = useShop.subscribe(check);
    // Also check once after the saved state loads, crediting progress made before achievements existed.
    const timer = setTimeout(check, 1500);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return null;
}
