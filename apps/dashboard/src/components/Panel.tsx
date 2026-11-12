import { useTheme, useWindowClass } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

/** A titled section of the Live load page: white on the surface, hairline edge, flat. */
export function Panel({
  step,
  title,
  subtitle,
  aside,
  children,
  style,
}: {
  /** A numbered section of a form (Send alert): shown in a circle before the title. */
  step?: number;
  title: string;
  subtitle?: string;
  /** Right of the title: a legend or a chip. */
  aside?: ReactNode;
  children: ReactNode;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const compact = useWindowClass() === 'compact';
  return (
    <View
      style={[
        {
          gap: t.space[5],
          padding: t.space[compact ? 4 : 6],
          borderRadius: t.radius.lg,
          backgroundColor: t.color.surfaceContainerLowest,
          borderWidth: t.borderWidth.hairline,
          borderColor: t.color.outlineVariant,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: t.space[3],
        }}
      >
        <View style={{ flexShrink: 1, gap: t.space[0.5] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
            {step !== undefined ? (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: t.color.primaryContainer,
                }}
              >
                <Text variant="labelLarge" color="onPrimaryContainer">
                  {step}
                </Text>
              </View>
            ) : null}
            <Text variant={compact ? 'titleMedium' : 'titleLarge'}>{title}</Text>
          </View>
          {subtitle ? (
            <Text variant="bodyMedium" color="onSurfaceVariant" style={{ maxWidth: 640 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {aside}
      </View>
      {children}
    </View>
  );
}
