import { POLL_INTERVAL_MS, type MockAlertView } from '@kapitwatt/shared';
import { useQuery } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as endpoints from './endpoints';
import { formatClock } from './format';
import { pushRegistered, registerForPush } from './push';
import { queryKeys } from './queries';

/**
 * In-app alert check: a stand-in for real push while the app runs in Expo Go, where Android has no
 * remote push since SDK 53. On an installed build ./push registers the phone for real push and this
 * local notification is skipped, so an alert never notifies twice. While the app is open it asks the API for the active alert every
 * POLL_INTERVAL_MS and shows a LOCAL notification the first time it sees a new one. It does not
 * wake a closed app; real Expo Push (API side, rule 4) needs an installed build.
 */

const CHANNEL_ID = 'grid-alerts';

// Show the banner and play the sound even while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function setUpNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Grid alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400],
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function notify(view: MockAlertView) {
  const { alert } = view;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: alert.level === 'red' ? 'Red alert: please cut your load' : 'Yellow alert on the grid',
      body: `Peak window ${formatClock(alert.windowStart)} to ${formatClock(alert.windowEnd)}. Tap to commit a cut.`,
      data: { alertId: alert.id },
      sound: 'default',
    },
    trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
  });
}

/** Mount once, in the root layout. */
export function useAlertWatcher() {
  const seen = useRef(new Set<string>());
  const allowed = useRef<Promise<boolean> | null>(null);

  // Shares the cache entry with the Home screen, so both stay in sync.
  const active = useQuery({
    queryKey: queryKeys.activeAlert,
    queryFn: endpoints.getActiveAlert,
    refetchInterval: POLL_INTERVAL_MS,
  });

  useEffect(() => {
    const view = active.data;
    if (!view || seen.current.has(view.alert.id)) return;
    if (view.alert.status === 'settled' || view.alert.status === 'cancelled') return;
    seen.current.add(view.alert.id);
    if (pushRegistered()) return;
    allowed.current ??= setUpNotifications().catch(() => false);
    void allowed.current.then((ok) => (ok ? notify(view) : undefined));
  }, [active.data]);

  // On start, for a household that signed up in an earlier session (tokens can change).
  useEffect(() => {
    void registerForPush();
  }, []);

  // Tapping the notification opens the event screen (FR-APP-05).
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const alertId = response?.notification.request.content.data?.alertId;
    if (typeof alertId === 'string') {
      router.push({ pathname: '/alert/[alertId]', params: { alertId } });
    }
  }, [response]);
}
