import type { AlertHistoryItem } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import type { DashboardAlert } from '@/api/client';
import { AlertRow } from './AlertRow';

/** One day of the timeline: its label, then its alerts as rows. */
export function DayGroup({
  label,
  alerts,
  historyOf,
  reachOf,
  open,
  currentId,
  wide,
  onToggle,
}: {
  label: string;
  alerts: DashboardAlert[];
  historyOf: (id: string) => AlertHistoryItem | undefined;
  reachOf: (a: DashboardAlert) => string;
  open: string | null;
  currentId?: string;
  wide: boolean;
  onToggle: (id: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space[2] }}>
      <Text variant="titleSmall" color="onSurfaceVariant" style={{ marginTop: t.space[2] }}>
        {label}
      </Text>
      {alerts.map((a) => (
        <AlertRow
          key={a.id}
          alert={a}
          history={historyOf(a.id)}
          reach={reachOf(a)}
          expanded={open === a.id}
          current={currentId === a.id}
          wide={wide}
          onToggle={() => onToggle(a.id)}
        />
      ))}
    </View>
  );
}
