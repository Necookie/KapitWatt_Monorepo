import { Icon } from '@kapitwatt/icons';
import { POLL_INTERVAL_MS, type AlertHistoryItem, type AlertStatus } from '@kapitwatt/shared';
import { Chip, SegmentedButtons, Stack, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { dayAndClock, kw } from '@/utils/format';
import { STATUS } from '../utils/status';
import { VIEWS, type Tab } from '../utils/views';

/** The alert in view and its chips, beside the view switcher. */
export function AnalyticsHeader({
  shown,
  status,
  view,
  onViewChange,
}: {
  shown?: AlertHistoryItem;
  status?: AlertStatus;
  view: Tab;
  onViewChange: (view: Tab) => void;
}) {
  return (
    <Stack direction="row" justify="space-between" align="flex-end" gap={4} wrap>
      {/* No page heading (the top bar names the page): the alert in view and its chips. */}
      <Stack gap={2} style={{ flexShrink: 1 }}>
        <Text variant="titleMedium">
          {shown
            ? `Alert of ${dayAndClock(shown.windowStart)} · target ${kw(shown.targetKw)} kW`
            : 'How an event performed and where verified kW was lost'}
        </Text>
        <Stack direction="row" gap={2} wrap>
          {shown ? (
            <Chip
              label={shown.level === 'red' ? 'Red alert' : 'Yellow alert'}
              tone={shown.level === 'red' ? 'alertRed' : 'alertYellow'}
              icon={
                <Icon
                  name="alert"
                  size="sm"
                  color={shown.level === 'red' ? 'onAlertRedContainer' : 'onAlertYellowContainer'}
                />
              }
            />
          ) : null}
          {status ? <Chip label={STATUS[status].label} tone={STATUS[status].tone} /> : null}
          <Chip
            label="Simulated pilot"
            tone="simulated"
            icon={<Icon name="simulated" size="sm" color="onSimulatedContainer" />}
          />
          {shown ? (
            <Text variant="bodySmall" color="onSurfaceVariant" style={{ alignSelf: 'center' }}>
              Refreshes every {POLL_INTERVAL_MS / 1000} s
            </Text>
          ) : null}
        </Stack>
      </Stack>
      <View style={{ flexGrow: 1, flexBasis: 300, maxWidth: 480 }}>
        <SegmentedButtons
          segments={VIEWS}
          value={view}
          onChange={onViewChange}
          accessibilityLabel="Analytics view"
        />
      </View>
    </Stack>
  );
}
