import { useTheme } from '@kapitwatt/hooks';
import { Logo } from '@kapitwatt/ui';
import { View } from 'react-native';
import { DataSource } from './DataSource';
import { BAR_HEIGHT } from '../utils/dimensions';

export function CompactTopBar() {
  const t = useTheme();
  return (
    <View
      style={{
        height: BAR_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: t.space[3],
        paddingHorizontal: t.space[4],
      }}
    >
      <Logo height={24} />
      <DataSource dense />
    </View>
  );
}
