import { useTheme } from '@kapitwatt/hooks';
import { View } from 'react-native';
import { RailItem } from './RailItem';
import { DESTINATIONS } from '../utils/navigation';

export function BottomBar() {
  const t = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: t.space[3],
        paddingBottom: t.space[4],
      }}
    >
      {DESTINATIONS.map((item) => (
        <RailItem key={item.href} item={item} stretch />
      ))}
    </View>
  );
}
