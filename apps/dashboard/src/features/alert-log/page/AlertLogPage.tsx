import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { useLayoutValue } from '@/hooks/useLayoutValue';
import { Notice } from '@/components/ui/Notice';
import { errorMessage } from '@/api/client';
import { DayGroup } from '../components/DayGroup';
import { LogFilters } from '../components/LogFilters';
import { LogSummary } from '../components/LogSummary';
import { NoAlerts } from '../components/NoAlerts';
import { useAlertLogView } from '../hooks/useAlertLogView';

/**
 * FR-DASH-13: every alert with sender, time, level, window and targets, newest first. Figures over
 * the log, filters by level and stage, then a timeline grouped by day; each row opens its message
 * and links.
 */
export default function AlertLogPage() {
  const t = useTheme();
  const view = useAlertLogView();
  const { log, alerts, shown } = view;
  const [wide, onLayout] = useLayoutValue((w) => w >= 760);

  return (
    <View onLayout={onLayout} style={{ gap: t.space[4] }}>
      {log.error ? <Notice tone="critical">{errorMessage(log.error)}</Notice> : null}

      {!log.isLoading && alerts.length === 0 && !log.error ? (
        <NoAlerts />
      ) : (
        <>
          <LogSummary alerts={alerts} history={view.history.data} />

          <LogFilters
            level={view.level}
            onLevel={view.setLevel}
            stage={view.stage}
            onStage={view.setStage}
            shown={shown.length}
            total={alerts.length}
          />

          {log.isLoading ? (
            <Text variant="bodyMedium" color="onSurfaceVariant">
              Loading the alert log.
            </Text>
          ) : shown.length === 0 ? (
            <Text variant="bodyMedium" color="onSurfaceVariant">
              No alerts match these filters.
            </Text>
          ) : (
            view.days.map(([label, list]) => (
              <DayGroup
                key={label}
                label={label}
                alerts={list}
                historyOf={view.historyOf}
                reachOf={view.reachOf}
                open={view.open}
                currentId={view.currentId}
                wide={wide}
                onToggle={view.toggle}
              />
            ))
          )}
        </>
      )}

      <Text variant="bodySmall" color="onSurfaceVariant">
        The NGCP alert is simulated: the operator plays Meralco. Push goes only to opted-in phones
        in the targeted barangays; simulated households receive nothing.
      </Text>
    </View>
  );
}
