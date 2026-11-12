import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/**
 * Browser-style :focus-visible for React Native web. Pressable reports `focused` after a mouse click
 * too, which leaves a focus ring on whatever was clicked. This tracks how the user last interacted:
 * a key press turns rings on, a pointer press turns them off. On native it is always false (no rings).
 */
let keyboard = false;
const listeners = new Set<() => void>();

function set(value: boolean) {
  if (keyboard === value) return;
  keyboard = value;
  listeners.forEach((l) => l());
}

// The package has no DOM types (it also runs on native); describe the little of `document` used here.
type KeyEvent = { metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean };
type Doc = { addEventListener(type: string, fn: (e: KeyEvent) => void, capture?: boolean): void };

let installed = false;
function install() {
  const doc = (globalThis as { document?: Doc }).document;
  if (installed || Platform.OS !== 'web' || !doc) return;
  installed = true;
  doc.addEventListener(
    'keydown',
    (e) => {
      if (!e.metaKey && !e.ctrlKey && !e.altKey) set(true);
    },
    true,
  );
  for (const type of ['pointerdown', 'mousedown', 'touchstart']) {
    doc.addEventListener(type, () => set(false), true);
  }
}

function subscribe(listener: () => void) {
  install();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True when focus rings should show: the user is navigating with the keyboard. */
export function useFocusVisible(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => keyboard,
    () => false,
  );
}
