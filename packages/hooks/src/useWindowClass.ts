import type { WindowClass } from '@kapitwatt/tokens';
import { useWindowDimensions } from 'react-native';
import { windowClassFor } from './windowClass';

export function useWindowClass(): WindowClass {
  return windowClassFor(useWindowDimensions().width);
}
