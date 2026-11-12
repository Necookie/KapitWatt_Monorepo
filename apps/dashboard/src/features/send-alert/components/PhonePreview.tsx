import { useTheme } from '@kapitwatt/hooks';
import { color as roles } from '@kapitwatt/tokens';
import { Logo, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { ON_SOFT } from '@/styles/on-brand';

/** The push as households will see it, on Grid Indigo like the app's own alert screen. */
export function PhonePreview({ title, body }: { title: string; body: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        gap: t.space[3],
        padding: t.space[5],
        borderRadius: t.radius.xl,
        backgroundColor: roles.light.brand,
      }}
    >
      <Text variant="labelLarge" style={{ color: ON_SOFT }}>
        What households receive
      </Text>
      <View
        accessibilityLabel={`Notification preview: ${title}. ${body}`}
        style={{
          gap: t.space[1],
          padding: t.space[4],
          borderRadius: t.radius.lg,
          backgroundColor: roles.light.surfaceContainerLowest,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[2] }}>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: roles.light.primaryContainer,
            }}
          >
            <Logo variant="mark" height={16} />
          </View>
          <Text variant="labelMedium" style={{ color: roles.light.onSurfaceVariant }}>
            KapitWatt · now
          </Text>
        </View>
        <Text variant="titleSmall" style={{ color: roles.light.onSurface }}>
          {title}
        </Text>
        <Text variant="bodyMedium" style={{ color: roles.light.onSurface }}>
          {body}
        </Text>
      </View>
      <Text variant="bodySmall" style={{ color: ON_SOFT }}>
        Push goes only to opted-in phones in the barangays picked. Simulated households receive
        nothing. SMS is mocked.
      </Text>
    </View>
  );
}
