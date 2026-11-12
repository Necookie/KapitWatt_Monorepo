import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { layoutPaused, onLayoutResume } from '@/utils/layout-pause';

/**
 * A value derived from the width a block actually has (bento layouts follow the space, not the
 * window). Only the derived value is state, so a new width that keeps the same layout re-renders
 * nothing. While the sidebar animates (lib/layout-pause) the latest width is held and applied once
 * the motion ends.
 */
export function useLayoutValue<T>(select: (width: number) => T) {
  const [value, setValue] = useState(() => select(0));
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
