import { Icon, type IconName } from '@kapitwatt/icons';
import { Card, Divider, Stack, Text } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { PlotSkeleton } from './PlotSkeleton';
import { motion } from '@/styles/motion';

/** A titled panel: the dashboard's outlined card with an icon, a title, an optional note and an aside. */
export function AnalyticsPanel({
  title,
  icon,
  note,
  aside,
  children,
  style,
  loading = false,
  skeleton,
}: {
  title: string;
  icon?: IconName;
  note?: string;
  aside?: ReactNode;
  children?: ReactNode;
  style?: ViewStyle;
  /** Skeleton in place of the body while its data loads; the header stays. */
  loading?: boolean;
  /** Shaped like the body; a plot by default. */
  skeleton?: ReactNode;
}) {
  return (
    <Card variant="outlined" padding={0} style={style}>
      <Stack direction="row" align="center" justify="space-between" gap={3} padding={4} wrap>
        <Stack direction="row" align="center" gap={2} style={{ flexShrink: 1 }}>
          {icon ? <Icon name={icon} size="sm" color="onSurfaceVariant" /> : null}
          <View style={{ flexShrink: 1 }}>
            <Text variant="titleMedium">{title}</Text>
            {note ? (
              <Text variant="bodySmall" color="onSurfaceVariant">
                {note}
              </Text>
            ) : null}
          </View>
        </Stack>
        {aside}
      </Stack>
      <Divider />
      {/* Keyed by state so the body fades in when it replaces its skeleton. */}
      <View
        key={loading ? 'skeleton' : 'body'}
        style={[{ padding: 16 }, loading ? null : motion.fadeIn]}
        accessibilityLabel={loading ? `${title}: loading` : undefined}
      >
        {loading ? (skeleton ?? <PlotSkeleton />) : children}
      </View>
    </Card>
  );
}
