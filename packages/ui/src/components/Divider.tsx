import { useTheme } from '@kapitwatt/hooks';
import { View } from 'react-native';

export function Divider({ vertical = false, inset = 0 }: { vertical?: boolean; inset?: number }) {
  const t = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={
        vertical
          ? {
              width: t.borderWidth.hairline,
              alignSelf: 'stretch',
              marginVertical: inset,
              backgroundColor: t.color.outlineVariant,
            }
          : {
              height: t.borderWidth.hairline,
              alignSelf: 'stretch',
              marginHorizontal: inset,
              backgroundColor: t.color.outlineVariant,
            }
      }
    />
  );
}
