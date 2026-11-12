import { space, type Space } from '@kapitwatt/tokens';
import { View, type ViewProps, type ViewStyle } from 'react-native';

export type StackProps = ViewProps & {
  direction?: 'row' | 'column';
  /** Gap between children, in space-scale keys (4 = 16). */
  gap?: Space;
  padding?: Space;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
  flex?: number;
};

/** Layout primitive: lay out siblings with a token gap instead of per-child margins. */
export function Stack({
  direction = 'column',
  gap = 0,
  padding,
  align,
  justify,
  wrap,
  flex,
  style,
  ...rest
}: StackProps) {
  return (
    <View
      {...rest}
      style={[
        {
          flexDirection: direction,
          gap: space[gap],
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          flex,
        },
        padding != null ? { padding: space[padding] } : null,
        style,
      ]}
    />
  );
}
