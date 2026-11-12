import { useTheme } from '@kapitwatt/hooks';
import { duration, withAlpha } from '@kapitwatt/tokens';
import { DOM_KEYFRAMES, curve } from './motion';

/**
 * Page-wide CSS the React Native styles cannot express (the dashboard is web only). Mounted once
 * in the root layout.
 *
 * Scrollbars: thin, no track, and a rounded thumb in the theme's onSurfaceVariant that darkens on
 * hover. Chromium and Safari get the ::-webkit-scrollbar version (Chromium ignores those rules
 * once the standard scrollbar-color is set, so the standard pair is kept to Firefox).
 *
 * State layers: every control, and the surface it draws as its direct child, fades its hover, press
 * and selected colours instead of snapping. One rule covers every Pressable; an inline transition
 * (the sidebar's) still wins. Child, not descendant: a descendant selector would be matched against
 * every element inside every control on each style recalculation.
 *
 * Reduced motion: when the OS asks for it, every CSS animation and transition finishes at once.
 */
export function GlobalStyles() {
  const t = useTheme();
  const thumb = withAlpha(t.color.onSurfaceVariant, 0.28);
  const thumbHover = withAlpha(t.color.onSurfaceVariant, 0.5);
  const css = `
    @supports not selector(::-webkit-scrollbar) {
      * { scrollbar-width: thin; scrollbar-color: ${thumb} transparent; }
    }
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background-color: ${thumb};
      border-radius: ${t.radius.full}px;
      border: 3px solid transparent;
      background-clip: content-box;
      min-height: 32px;
    }
    ::-webkit-scrollbar-thumb:hover { background-color: ${thumbHover}; border-width: 2px; }
    ::-webkit-scrollbar-thumb:active { background-color: ${thumbHover}; }
    ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }

    :is(a, button, [role="button"], [role="link"], [role="radio"], [role="checkbox"], [role="tab"],
      [role="switch"], [role="menuitem"], [tabindex="0"]),
    :is(a, button, [role="button"], [role="link"], [role="radio"], [role="checkbox"], [role="tab"],
      [role="switch"], [role="menuitem"], [tabindex="0"]) > * {
      transition-property: background-color, border-color, color;
      transition-duration: ${duration.short3}ms;
      transition-timing-function: ${curve.standard};
    }

    ${DOM_KEYFRAMES}

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 1ms !important;
        animation-delay: 0ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 1ms !important;
        transition-delay: 0ms !important;
      }
    }
  `;
  return <style>{css}</style>;
}
