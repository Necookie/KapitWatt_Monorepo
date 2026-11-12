import { useTheme } from '@kapitwatt/hooks';
import { fontFamily } from '@kapitwatt/tokens';
import type { CSSProperties } from 'react';

/** Hover tooltip for the SVG plots: inverse surface, like the design system's snackbars. */
export function Tooltip({ left, top, lines }: { left: string; top: number; lines: string[] }) {
  const t = useTheme();
  const style: CSSProperties = {
    position: 'absolute',
    left,
    top,
    transform: 'translate(-50%, -100%)',
    background: t.color.inverseSurface,
    color: t.color.inverseOnSurface,
    borderRadius: t.radius.sm,
    padding: '6px 10px',
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: '16px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 2,
  };
  return (
    <div style={style}>
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
}
