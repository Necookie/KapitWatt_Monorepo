import { useTheme } from '@kapitwatt/hooks';
import { pauseLayout } from '@/utils/layout-pause';
import { useDrawerCollapsed } from './useDrawerCollapsed';
import { DRAWER_WIDTH, RAIL_WIDTH } from '../utils/dimensions';

/**
 * Navigation follows the M3 window size classes: drawer at expanded and wider (840+), rail at medium
 * (600 to 839), top app bar plus bottom navigation bar at compact. Pages render their own PageHeader.
 */
/**
 * Collapse and expand: the space the sidebar takes moves with a CSS width transition, so the page
 * reflows with it (the browser does that natively); the sidebar is an overlay whose clip-path moves
 * in step. Width-driven layout in the page pauses for the duration and settles once at the end.
 */
export function useSidebar(drawerFits: boolean) {
  const { duration } = useTheme().motion;
  const [collapsed, persist] = useDrawerCollapsed();
  if (!drawerFits) return { collapsed: true, width: RAIL_WIDTH, toggle: undefined };
  const toggle = (next: boolean) => {
    pauseLayout(duration.medium2 + 50);
    persist(next);
  };
  return { collapsed, width: collapsed ? RAIL_WIDTH : DRAWER_WIDTH, toggle };
}
