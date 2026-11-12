import { router } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSheetRise } from './useSheetRise';
import { useStoryPager } from './useStoryPager';

/** Welcome's state: the story pager, and joining or logging in by raising the sheet first. */
export function useWelcome() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sheetRise = useSheetRise(height);
  const story = useStoryPager(width);

  const join = () => sheetRise.rise(() => router.push('/sign-up'));
  const logIn = () => sheetRise.rise(() => router.push('/login'));

  return { insets, width, sheetRise, story, join, logIn };
}
