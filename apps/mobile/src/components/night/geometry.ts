import { MOON_OUTER } from './Moon';
import { SCENE } from './Skyline';

/** Where the white sheet starts on the night pages (sign-up under its street, login under the moon). */

/** How far sign-up's white sheet covers the foot of its street (px). */
export const SHEET_OVERLAP = 12;
/** Login's night above the sheet: the back row, then the moon and the space under it (px). */
export const LOGIN_TOP_ROW = 48;
export const LOGIN_MOON_GAP = 16;

/** The street's height for a screen width (it is drawn edge to edge). */
export const streetHeight = (width: number) => (SCENE.height * width) / SCENE.width;

/** Sign-up's sheet: under the street, covering its foot. */
export const signUpSheetTop = (insetTop: number, width: number) =>
  insetTop + streetHeight(width) - SHEET_OVERLAP;

/** Login's sheet: just under the moon. */
export const loginSheetTop = (insetTop: number) =>
  insetTop + LOGIN_TOP_ROW + MOON_OUTER + LOGIN_MOON_GAP;
