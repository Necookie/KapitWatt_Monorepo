import { router, type Href } from 'expo-router';

/**
 * Go to a screen with nothing behind it. Used when the signed-in household changes (sign-up, log in,
 * log out, account deleted), so the Android back button can never return to the screens of the
 * previous state, such as the welcome screen after joining or the profile after logging out.
 */
export function startOver(href: Href): void {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}
