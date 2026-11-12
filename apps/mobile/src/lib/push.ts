import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { hasAuthToken } from './api';
import { MOCK } from './config';
import { savePushToken } from './endpoints';

/**
 * Real push (FR-APP-05): hand this phone's Expo push token to the API, which sends the alerts
 * (rule 4). Needs an installed build with an EAS project id; Expo Go on Android has no remote
 * push since SDK 53, and there the in-app alert check in ./alertWatcher stays the stand-in.
 */

export const ALERT_CHANNEL_ID = 'grid-alerts';

/**
 * Android only: the channel alerts are shown on. It must exist before permission is requested,
 * because Android 13 and later does not show the permission prompt until the app has a channel.
 */
export async function ensureAlertChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ALERT_CHANNEL_ID, {
    name: 'Grid alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 400, 200, 400],
  });
}

let registered = false;

/** True once the API holds this phone's push token, so alerts arrive as real pushes. */
export const pushRegistered = () => registered;

/** After log out or account deletion: the next household to sign in on this phone registers again. */
export function forgetPush(): void {
  registered = false;
}

/**
 * Safe to call any time: after sign-up and on every app start (tokens can change). Does nothing
 * without a household token, on an emulator, without permission or without a project id.
 */
export async function registerForPush(): Promise<void> {
  // No push in the browser preview (expo-notifications is not available on web).
  if (registered || Platform.OS === 'web' || MOCK.account || !hasAuthToken() || !Device.isDevice) {
    return;
  }
  try {
    const projectId: unknown =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (typeof projectId !== 'string') return;

    await ensureAlertChannel();
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    await savePushToken(data);
    registered = true;
  } catch {
    // Expo Go, no network, or the API refused: the household still sees alerts on opening the app.
  }
}
