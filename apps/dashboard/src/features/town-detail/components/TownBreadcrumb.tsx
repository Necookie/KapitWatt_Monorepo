import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/styles/theme';

export function TownBreadcrumb({ name }: { name: string | undefined }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <Link href="/" asChild>
        <Pressable accessibilityRole="link">
          <Txt size="sm" weight="600" style={{ color: colors.brandStrong }}>
            Live load
          </Txt>
        </Pressable>
      </Link>
      <Txt size="sm" tone="faint">
        /
      </Txt>
      <Txt size="sm" tone="muted">
        {name}
      </Txt>
    </View>
  );
}
