import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAlertHistory, useCurrentAlert, useSimStatus, useTotals } from '@/api/queries';
import { useSimParams } from '@/hooks/sim-params';
import { useAnalytics } from '../api/useAnalytics';
import { VIEWS, type Tab } from '../utils/views';

/**
 * Which alert and view the analytics page shows, and everything derived from them. Defaults to the
 * current alert, else the most recent; `?alert=<id>` picks any alert and `?view=` the tab.
 */
export function useAnalyticsView() {
  const router = useRouter();
  const params = useLocalSearchParams<{ alert?: string; view?: string }>();
  const view: Tab = VIEWS.some((v) => v.value === params.view) ? (params.view as Tab) : 'overview';
  const current = useCurrentAlert();
  const history = useAlertHistory();
  // A settled alert is no longer "current", but it is the one an operator wants to analyse.
  const alertId = params.alert ?? current.data?.id ?? history.data?.[0]?.alertId;

  const analytics = useAnalytics(alertId);
  const totals = useTotals(alertId);
  const sim = useSimStatus();
  const { params: simParams } = useSimParams();

  const a = analytics.data;
  const shown = history.data?.find((h) => h.alertId === alertId);
  const failed = analytics.error ?? history.error;
  // Still finding out which alert to show, or loading it: skeletons, not a blank page.
  const waiting =
    !a && (analytics.isLoading || (!alertId && (current.isLoading || history.isLoading)));
  const noAlert = !alertId && !current.isLoading && !history.isLoading;
  const totalsLoading = !totals.data && totals.isLoading;
  const households = sim.data?.simulatedHouseholds || a?.optedInHouseholds || 0;

  return {
    view,
    setView: (v: Tab) => router.setParams({ view: v }),
    alertId,
    selectAlert: (id: string) => router.setParams({ alert: id }),
    a,
    shown,
    failed,
    waiting,
    noAlert,
    totals: totals.data,
    totalsLoading,
    alerts: history.data ?? [],
    historyLoading: history.isLoading,
    simLoading: sim.isLoading,
    simParams,
    households,
  };
}
