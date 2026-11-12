/**
 * One frame, one pane: the drawer (or rail) sits on the frame tone and the page in a lighter pane with
 * a large rounded corner. On drawer and rail the top app bar shares the frame tone and names the page.
 */
export const BAR_HEIGHT = 64;
export const CONTENT_MAX_WIDTH = 1240;
/** Drawer rhythm: 16 from the drawer edge to a highlight, 4 between items, 24 between sections. */
export const DRAWER_ITEM_HEIGHT = 52;

export const COLLAPSED_KEY = 'kapitwatt.drawerCollapsed';

export const DRAWER_WIDTH = 280;
export const RAIL_WIDTH = 80;
/** Inside both widths: 12 from the edge, so an icon sits at the rail's centre (12 + 16 + 12 = 40). */
export const NAV_INSET = 12;
export const ITEM_WIDTH = DRAWER_WIDTH - NAV_INSET * 2;
export const ITEM_COLLAPSED = RAIL_WIDTH - NAV_INSET * 2;
