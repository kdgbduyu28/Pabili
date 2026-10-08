import * as Notifications from 'expo-notifications';
import { Href, router } from 'expo-router';
import { useEffect } from 'react';
import { sync } from '../lib/push';
import { useShop } from '../store/useShop';

/** Phone-only: keeps scheduled reminders in step with the store and opens the right screen on tap. */
export function Notifier() {
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      clearTimeout(timer);
      timer = setTimeout(() => sync(useShop.getState()).catch(() => {}), 800);
    };
    const unsubscribe = useShop.subscribe(run);
    run();
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const href = response?.notification.request.content.data?.href;
    if (typeof href === 'string' && response?.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      router.push(href as Href);
    }
  }, [response]);

  return null;
}
