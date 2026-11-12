import { useTheme } from '@kapitwatt/hooks';
import { withAlpha } from '@kapitwatt/tokens';

/**
 * Page-wide CSS the React Native styles cannot express (the dashboard is web only). Mounted once
 * in the root layout.
 *
 * Scrollbars: thin, no track, and a rounded thumb in the theme's onSurfaceVariant that darkens on
 * hover. Chromium and Safari get the ::-webkit-scrollbar version (Chromium ignores those rules
 * once the standard scrollbar-color is set, so the standard pair is kept to Firefox).
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
  `;
  return <style>{css}</style>;
}
