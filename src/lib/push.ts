import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useShop } from '../store/useShop';
import { DAILY_ID, plan } from './reminders';

/** Local notifications only exist on phones; the web build skips all of this. */
export const NOTIFICATIONS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

type State = ReturnType<typeof useShop.getState>;

let configured = false;

function configure() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', { name: 'Pabili', importance: Notifications.AndroidImportance.DEFAULT }).catch(() => {});
  }
}

export async function permission(ask: boolean): Promise<boolean> {
  if (!NOTIFICATIONS_SUPPORTED) return false;
  configure();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!ask || !current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

/**
 * Make the scheduled notifications match `plan`: cancel what's no longer wanted,
 * schedule what's missing. Safe to call as often as state changes.
 */
export async function sync(s: State, now = Date.now()): Promise<void> {
  if (!NOTIFICATIONS_SUPPORTED) return;
  const wanted = s.settings.notifications === false ? [] : plan(s, now);
  // Ask once, the first time there's something worth notifying about beyond the daily reminder.
  const ask = wanted.some((w) => w.id !== DAILY_ID) && !s.stats.notifAsked;
  if (ask) s.bumpStat('notifAsked');
  if (!(await permission(ask))) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const have = new Set(scheduled.map((n) => n.identifier));
  const want = new Set(wanted.map((w) => w.id));
  await Promise.all(scheduled.filter((n) => !want.has(n.identifier)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  for (const w of wanted) {
    if (have.has(w.id)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: w.id,
      content: { title: w.title, body: w.body, data: { href: w.href } },
      trigger:
        'daily' in w
          ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...w.daily }
          : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(w.at) },
    });
  }
}
