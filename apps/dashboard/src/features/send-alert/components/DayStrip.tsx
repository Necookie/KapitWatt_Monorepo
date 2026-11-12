import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { clock } from '@/utils/format';
import { HOUR } from '../utils/window';
import { Legend } from './Legend';

/** Where the window sits in its day: a 24-hour strip with the window filled, and "now" marked. */
export function DayStrip({ start, end }: { start: Date; end: Date }) {
  const t = useTheme();
  const day = new Date(start);
  day.setHours(0, 0, 0, 0);
  const at = (d: Date) => Math.min(1, Math.max(0, (d.getTime() - day.getTime()) / (24 * HOUR)));
  const now = new Date();
  const nowAt =
    now.getTime() >= day.getTime() && now.getTime() < day.getTime() + 24 * HOUR ? at(now) : null;
  return (
    <View style={{ gap: t.space[1] }}>
      <View
        accessibilityLabel={`Window ${clock(start.toISOString())} to ${clock(end.toISOString())}`}
        style={{
          height: 20,
          borderRadius: t.radius.xs,
          backgroundColor: t.color.surfaceContainerHigh,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${at(start) * 100}%`,
            width: `${Math.max(0.6, (at(end) - at(start)) * 100)}%`,
            backgroundColor: t.color.primary,
            borderRadius: t.radius.xs,
          }}
        />
        {nowAt !== null ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${nowAt * 100}%`,
              width: 2,
              backgroundColor: t.color.tertiary,
            }}
          />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: t.space[4] }}>
        <Legend color={t.color.primary} label="Peak window" />
        {nowAt !== null ? <Legend color={t.color.tertiary} label="Now" /> : null}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {['12 AM', '6 AM', '12 PM', '6 PM', '12 AM'].map((label, i) => (
          <Text key={i} variant="labelSmall" color="onSurfaceVariant">
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
