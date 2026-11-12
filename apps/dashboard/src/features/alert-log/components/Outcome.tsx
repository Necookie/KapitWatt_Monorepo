import type { AlertHistoryItem } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { ProgressBar, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import type { DashboardAlert } from '@/api/client';
import { kw } from '@/utils/format';

/** Committed while it runs, delivered of target once settled; from the analytics history. */
export function Outcome({
  alert: a,
  history: h,
}: {
  alert: DashboardAlert;
  history?: AlertHistoryItem;
}) {
  const t = useTheme();
  if (a.status === 'cancelled') {
    return (
      <Text variant="bodySmall" color="onSurfaceVariant">
        Lifted before the window ended
      </Text>
    );
  }
  if (!h) {
    return (
      <Text variant="bodySmall" color="onSurfaceVariant">
        Outcome needs the live API
      </Text>
    );
  }
  const settled = a.status === 'settled' && h.deliveredKw !== null;
  const value = settled ? (h.deliveredKw as number) : h.committedKw;
  const max = Math.max(a.targetKw, value, 1);
  return (
    <View style={{ gap: t.space[0.5] }}>
      <Text variant="bodySmall" color="onSurfaceVariant" style={{ fontVariant: ['tabular-nums'] }}>
        {settled
          ? `Delivered ${kw(Math.round(value))} of ${kw(a.targetKw)} kW`
          : `Committed ${kw(Math.round(value))} kW`}
      </Text>
      <ProgressBar
        value={value / max}
        target={a.targetKw / max}
        tone={settled ? 'relief' : 'primary'}
        accessibilityLabel={
          settled ? 'Delivered against the target' : 'Committed against the target'
        }
      />
    </View>
  );
}
