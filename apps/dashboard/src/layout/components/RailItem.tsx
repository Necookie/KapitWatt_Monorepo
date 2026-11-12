import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import type { PressState } from '@/utils/press-state';
import { useActive } from '../hooks/useActive';
import { NO_NATIVE_OUTLINE, currentPage, focusRing, wash } from '../utils/interaction';
import { type Destination } from '../utils/navigation';

/** Rail destination; `stretch` shares the width evenly (bottom bar) instead of a fixed 80. */
export function RailItem({ item, stretch = false }: { item: Destination; stretch?: boolean }) {
  const t = useTheme();
  const ring = useFocusVisible();
  const active = useActive(item);
  const fg = active ? t.color.onSecondaryContainer : t.color.onSurfaceVariant;
  return (
    <Link href={item.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        {...currentPage(active)}
        style={{ ...NO_NATIVE_OUTLINE, ...(stretch ? { flex: 1, minWidth: 0 } : null) }}
      >
        {(s: PressState) => (
          <View
            style={{
              alignItems: 'center',
              gap: t.space[1],
              width: stretch ? '100%' : 80,
              paddingVertical: t.space[1],
            }}
          >
            <View
              style={[
                {
                  width: 56,
                  height: 32,
                  borderRadius: t.radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active
                    ? t.color.secondaryContainer
                    : wash(t, t.color.onSurface, s),
                },
                focusRing(t, s, ring),
              ]}
            >
              <Icon name={item.icon} weight={active ? 'fill' : 'regular'} color={fg} />
            </View>
            <Text
              variant="labelMedium"
              numberOfLines={1}
              style={{ color: active ? t.color.onSurface : t.color.onSurfaceVariant }}
            >
              {item.short}
            </Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}
