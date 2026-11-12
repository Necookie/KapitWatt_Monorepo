import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { usePathname } from 'expo-router';
import { View } from 'react-native';
import { ChangeLink } from './ChangeLink';
import { BAR_HEIGHT, CONTENT_MAX_WIDTH } from '../utils/dimensions';
import { DESTINATIONS } from '../utils/navigation';

/**
 * Top app bar for drawer and rail layouts: the page title, on the frame tone and in the same 64 px band
 * as the logo row, lined up with the page's centred max width and gutter.
 */
export function TopAppBar({ gutter }: { gutter: number }) {
  const t = useTheme();
  const pathname = usePathname();
  const page = DESTINATIONS.find((d) => (d.match ? d.match(pathname) : pathname === d.href));
  return (
    <View style={{ height: BAR_HEIGHT, justifyContent: 'center', paddingHorizontal: gutter }}>
      <View
        style={{
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.space[3],
        }}
      >
        <Text variant="titleLarge" accessibilityRole="header" numberOfLines={1} style={{ flex: 1 }}>
          {page?.label ?? 'KapitWatt'}
        </Text>
        <ChangeLink />
      </View>
    </View>
  );
}
