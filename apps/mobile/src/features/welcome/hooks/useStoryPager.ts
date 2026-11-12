import { useRef, useState, type ComponentRef } from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from 'react-native';
import { AFTER_CUT_MS } from '../utils/story';

/**
 * The three swiped panels: which one is showing, the pager's height, and the try-it cut. Once the
 * cut is done the story moves on to the reward panel by itself.
 */
export function useStoryPager(width: number) {
  const pager = useRef<ComponentRef<typeof ScrollView>>(null);
  const cut = useRef(new Animated.Value(0)).current;
  const [page, setPage] = useState(0);
  const [cutDone, setCutDone] = useState(false);
  const [pagerHeight, setPagerHeight] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  const onPagerLayout = (e: LayoutChangeEvent) => setPagerHeight(e.nativeEvent.layout.height);

  const onCut = () => {
    setCutDone(true);
    setTimeout(() => {
      pager.current?.scrollTo({ x: width * 2, animated: true });
      setPage(2);
    }, AFTER_CUT_MS);
  };

  return { pager, cut, page, cutDone, pagerHeight, onScroll, onPagerLayout, onCut };
}
