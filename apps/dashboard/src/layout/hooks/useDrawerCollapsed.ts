import { useState } from 'react';
import { COLLAPSED_KEY } from '../utils/dimensions';

/** The operator's choice of drawer or rail on wide windows, remembered in this browser only. */
export function useDrawerCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return globalThis.localStorage?.getItem(COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const set = (next: boolean) => {
    setCollapsed(next);
    try {
      globalThis.localStorage?.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // Storage blocked (private window): the choice lasts until reload.
    }
  };
  return [collapsed, set] as const;
}
