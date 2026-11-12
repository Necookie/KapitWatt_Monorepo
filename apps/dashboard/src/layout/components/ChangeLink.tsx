import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import type { PressState } from '@/utils/press-state';
import { NO_NATIVE_OUTLINE, focusRing, wash } from '../utils/interaction';

export function ChangeLink({ iconOnly = false }: { iconOnly?: boolean }) {
  const t = useTheme();
  const ring = useFocusVisible();
  return (
    <Link href="/simulator" asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Change simulation assumptions"
        style={NO_NATIVE_OUTLINE}
      >
        {(s: PressState) => (
          <View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.space[1],
                height: t.size.controlMd,
                minWidth: t.size.controlMd,
                justifyContent: 'center',
                paddingHorizontal: iconOnly ? 0 : t.space[3],
                borderRadius: t.radius.full,
                backgroundColor: wash(t, t.color.primary, s),
              },
              focusRing(t, s, ring),
            ]}
          >
            <Icon name="settings" size="sm" color="primary" />
            {iconOnly ? null : (
              <Text variant="labelLarge" color="primary">
                Change
              </Text>
            )}
          </View>
        )}
      </Pressable>
    </Link>
  );
}
