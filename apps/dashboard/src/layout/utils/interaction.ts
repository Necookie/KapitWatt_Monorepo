import type { Theme } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import type { PressState } from '@/utils/press-state';

/** Web screen readers announce the current page from aria-current (RN types do not list it; RN web forwards it). */
export function currentPage(active: boolean): Record<string, unknown> {
  return active ? { 'aria-current': 'page' } : {};
}

/** Hover and press wash over a content colour (M3 state layer). */
export function wash(t: Theme, color: string, s: PressState) {
  const o = s.pressed ? t.stateLayer.pressed : s.hovered ? t.stateLayer.hover : 0;
  return o ? withAlpha(color, o) : 'transparent';
}

/** We draw our own rounded ring, so hide the browser's square outline on the link itself. */
export const NO_NATIVE_OUTLINE = { outlineWidth: 0 } as const;

/** Focus ring only for keyboard focus (:focus-visible), never after a click. */
export function focusRing(t: Theme, s: PressState, visible: boolean) {
  return s.focused && visible
    ? {
        outlineStyle: 'solid' as const,
        outlineWidth: t.borderWidth.focus,
        outlineColor: t.color.focusRing,
        outlineOffset: t.borderWidth.focusOffset,
      }
    : null;
}

export const bezier = (c: readonly number[]) => `cubic-bezier(${c.join(', ')})`;
