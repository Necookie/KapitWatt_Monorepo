import { useTheme } from '@kapitwatt/hooks';
import { View } from 'react-native';
import { Breadcrumbs } from './Breadcrumbs';
import { BAR_HEIGHT, CONTENT_MAX_WIDTH } from '../utils/dimensions';

/**
 * Top app bar for drawer and rail layouts: the page title as a breadcrumb trail, on the frame tone and in the same 64 px band
 * as the logo row, lined up with the page's centred max width and gutter.
 */
export function TopAppBar({ gutter }: { gutter: number }) {
  const t = useTheme();
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
        <Breadcrumbs />
      </View>
    </View>
  );
}
