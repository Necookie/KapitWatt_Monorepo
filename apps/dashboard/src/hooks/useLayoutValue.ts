import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { layoutPaused, onLayoutResume } from '@/utils/layout-pause';
import { useContentWidth } from './content-width';

/**
 * A value derived from the width a block actually has (bento layouts follow the space, not the
 * window). Only the derived value is state, so a new width that keeps the same layout re-renders
 * nothing. While the sidebar animates (lib/layout-pause) the latest width is held and applied once
 * the motion ends. The first render uses the shell's estimate of the page width (`initial` scales
 * it for a block narrower than the page), so a page-level breakpoint is right before the first
 * measure.
 */
export function useLayoutValue<T>(select: (width: number) => T, initial = 1) {
  const page = useContentWidth();
  const [value, setValue] = useState(() => select(page.current * initial));
  const pick = useRef(select);
  pick.current = select;
  const pending = useRef<number | undefined>(undefined);
  useEffect(
    () =>
      onLayoutResume(() => {
        if (pending.current !== undefined) setValue(pick.current(pending.current));
        pending.current = undefined;
      }),
    [],
  );
  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (layoutPaused()) pending.current = width;
    else setValue(pick.current(width));
  };
  return [value, onLayout] as const;
}
