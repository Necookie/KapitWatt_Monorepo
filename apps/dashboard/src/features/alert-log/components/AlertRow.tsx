import type { AlertHistoryItem } from '@kapitwatt/shared';
import { useFocusVisible, useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { withAlpha } from '@kapitwatt/tokens';
import { Button, Chip, Text } from '@kapitwatt/ui';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import type { DashboardAlert } from '@/api/client';
import { clock, power } from '@/utils/format';
import { hours } from '../utils/hours';
import { STATUS } from '../utils/status';
import { Outcome } from './Outcome';
import type { PressState } from '@/utils/press-state';

/**
 * One alert in the log: a strip in its NGCP level colour, when and by whom, the window and reach,
 * how it turned out, and its status. Tap to open the message, the push time and links.
 */
export function AlertRow({
  alert: a,
  history,
  reach,
  expanded,
  current,
  wide,
  onToggle,
}: {
  alert: DashboardAlert;
  history?: AlertHistoryItem;
  reach: string;
  expanded: boolean;
  /** The alert the Live load page is showing. */
  current: boolean;
  wide: boolean;
  onToggle: () => void;
}) {
  const t = useTheme();
  const c = t.color;
  const ring = useFocusVisible();
  const router = useRouter();
  const red = a.level === 'red';
  const status = STATUS[a.status];
  const levelName = red ? 'Red alert' : 'Yellow alert';

  const cells = (
    <>
      <View style={{ width: wide ? 96 : undefined, gap: t.space[0.5] }}>
        <Text variant="titleSmall" style={{ fontVariant: ['tabular-nums'] }}>
          {clock(a.createdAt)}
        </Text>
        <Text variant="bodySmall" color="onSurfaceVariant" numberOfLines={1}>
          {a.createdBy}
        </Text>
      </View>
      <View style={{ flex: wide ? 1 : undefined, minWidth: 0, gap: t.space[0.5] }}>
        <Text variant="titleSmall" numberOfLines={1}>
          {levelName} · {clock(a.windowStart)} to {clock(a.windowEnd)} ({hours(a)} h)
        </Text>
        <Text variant="bodySmall" color="onSurfaceVariant" numberOfLines={1}>
          {reach} · {power(a.targetKw)}
        </Text>
      </View>
      <View style={{ width: wide ? 210 : undefined, alignSelf: wide ? undefined : 'stretch' }}>
        <Outcome alert={a} history={history} />
      </View>
      <View style={{ width: wide ? 124 : undefined, alignItems: wide ? 'flex-end' : 'flex-start' }}>
        <Chip label={status.label} tone={status.tone} />
      </View>
    </>
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: t.radius.md,
        overflow: 'hidden',
        borderWidth: expanded ? 2 : t.borderWidth.hairline,
        borderColor: expanded ? c.primary : c.outlineVariant,
        backgroundColor: c.surfaceContainerLowest,
      }}
    >
      {/* The NGCP level, as colour and (in the row's text) as words. */}
      <View style={{ width: 6, backgroundColor: red ? c.alertRed : c.alertYellow }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${levelName} sent ${clock(a.createdAt)}, ${status.label}`}
          accessibilityState={{ expanded }}
          onPress={onToggle}
          style={{ outlineWidth: 0 }}
        >
          {(s: PressState) => (
            <View
              style={{
                flexDirection: wide ? 'row' : 'column',
                alignItems: wide ? 'center' : 'flex-start',
                gap: wide ? t.space[4] : t.space[2],
                paddingHorizontal: t.space[4],
                paddingVertical: t.space[3],
                backgroundColor:
                  s.pressed || s.hovered
                    ? withAlpha(c.onSurface, s.pressed ? t.stateLayer.pressed : t.stateLayer.hover)
                    : 'transparent',
                ...(s.focused && ring
                  ? {
                      outlineStyle: 'solid' as const,
                      outlineWidth: t.borderWidth.focus,
                      outlineColor: c.focusRing,
                    }
                  : null),
              }}
            >
              {cells}
              {wide ? (
                <Icon
                  name={expanded ? 'chevronUp' : 'chevronDown'}
                  size="sm"
                  color="onSurfaceVariant"
                />
              ) : null}
            </View>
          )}
        </Pressable>

        {expanded ? (
          <View
            style={{
              gap: t.space[3],
              paddingHorizontal: t.space[4],
              paddingBottom: t.space[4],
              paddingTop: t.space[3],
              borderTopWidth: t.borderWidth.hairline,
              borderTopColor: c.outlineVariant,
            }}
          >
            <Text variant="bodyMedium">“{a.message}”</Text>
            <Text variant="bodySmall" color="onSurfaceVariant">
              {a.pushSentAt
                ? `Push sent ${clock(a.pushSentAt)} to opted-in phones in these barangays.`
                : 'No push was sent (no opted-in phones, or simulated households only).'}{' '}
              Logged with sender and time.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
              {current ? (
                <Button
                  label="Open in Live load"
                  variant="tonal"
                  icon={<Icon name="chartLine" size="sm" color="onSecondaryContainer" />}
                  onPress={() => router.push('/')}
                />
              ) : null}
              {history ? (
                <Button
                  label="Analytics"
                  variant="outlined"
                  icon={<Icon name="chartBar" size="sm" color="primary" />}
                  onPress={() => router.push({ pathname: '/analytics', params: { alert: a.id } })}
                />
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
