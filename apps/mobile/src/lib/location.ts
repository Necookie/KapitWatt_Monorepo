import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

/**
 * Why we could not get a position:
 * - services_off: location (GPS) is switched off on the phone
 * - denied: the user said no, but we may ask again
 * - blocked: the user said no and the system will not ask again; only Settings can fix it
 */
export type LocationProblem = 'services_off' | 'denied' | 'blocked';

export class LocationError extends Error {
  constructor(public problem: LocationProblem) {
    super(`location_${problem}`);
  }
}

/** Current GPS position. Asks for permission if needed; throws LocationError otherwise. */
export async function currentPosition(): Promise<{ lat: number; lng: number }> {
  if (!(await Location.hasServicesEnabledAsync())) throw new LocationError('services_off');
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new LocationError(permission.canAskAgain ? 'denied' : 'blocked');
  }
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

/**
 * Show the system prompt that fixes the problem, where the platform allows one:
 * Android's "Turn on location" dialog, the permission prompt again, or the app's Settings page.
 * Resolves once the prompt is done; call currentPosition() again afterwards, or, for
 * 'opened_settings', once the user is back in the app.
 */
export async function fixLocation(
  problem: LocationProblem,
): Promise<'prompted' | 'opened_settings'> {
  if (problem === 'services_off' && Platform.OS === 'android') {
    // Rejects if the user taps "No thanks"; the caller simply tries again.
    await Location.enableNetworkProviderAsync().catch(() => undefined);
    return 'prompted';
  }
  if (problem === 'denied') {
    await Location.requestForegroundPermissionsAsync();
    return 'prompted';
  }
  // blocked, or location off on iOS (no in-app prompt for that): open Settings.
  await Linking.openSettings();
  return 'opened_settings';
}

/** Wording for each problem: what happened and what the button does. */
export const LOCATION_HELP: Record<LocationProblem, { message: string; button: string }> = {
  services_off: {
    message:
      'Location is turned off on your phone. KapitWatt needs it to check where meter photos are taken.',
    button: Platform.OS === 'android' ? 'Turn on location' : 'Open Settings',
  },
  denied: {
    message: 'KapitWatt needs your location to check where meter photos are taken.',
    button: 'Allow location',
  },
  blocked: {
    message: 'Location is blocked for KapitWatt. Allow it in Settings, then come back.',
    button: 'Open Settings',
  },
};
