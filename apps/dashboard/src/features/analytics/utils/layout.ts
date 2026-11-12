import type { ViewStyle } from 'react-native';

export const grow = (basis: number, weight = 1): ViewStyle => ({
  flexGrow: weight,
  flexBasis: basis,
  minWidth: Math.min(basis, 320),
});
