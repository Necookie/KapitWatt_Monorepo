import { Stack, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { fraction } from '@/utils/format';
import { AnalyticsHeader } from '../components/AnalyticsHeader';
import { AnalyticsNotice } from '../components/AnalyticsNotice';
import { BarangaysView } from '../components/views/BarangaysView';
import { OverviewView } from '../components/views/OverviewView';
import { SkeletonView } from '../components/views/SkeletonView';
import { TrendsView } from '../components/views/TrendsView';
import { VerificationView } from '../components/views/VerificationView';
import { useAnalyticsView } from '../hooks/useAnalyticsView';
import { motion } from '@/styles/motion';

/**
 * Analytics: how an event performed and where verified kW was lost, in four views. Defaults to the
 * current alert, else the most recent; `?alert=<id>` picks any alert and `?view=` the tab, so a view
 * can be linked. Aggregates per barangay only, as everywhere on the dashboard.
 */
export default function AnalyticsPage() {
  const v = useAnalyticsView();
  const { a, view } = v;

  return (
    <Stack gap={5}>
      <AnalyticsHeader shown={v.shown} status={a?.status} view={view} onViewChange={v.setView} />

      <AnalyticsNotice failed={v.failed} noAlert={v.noAlert} />

      {/* Keyed by tab: switching views cross-fades instead of cutting. */}
      {a && view !== 'trends' ? (
        <View key={view} style={motion.fadeIn}>
          {view === 'overview' ? (
            <OverviewView
              a={a}
              deliveredAmiKw={v.totals?.deliveredAmiKw}
              deliveredPhotoKw={v.totals?.deliveredPhotoKw}
            />
          ) : view === 'verification' ? (
            <VerificationView a={a} />
          ) : view === 'barangays' ? (
            <BarangaysView barangays={v.totals?.barangays ?? []} loading={v.totalsLoading} />
          ) : null}
        </View>
      ) : !a && v.waiting ? (
        <SkeletonView view={view} />
      ) : null}

      {view === 'trends' ? (
        <View style={motion.fadeIn}>
          <TrendsView
            alerts={v.alerts}
            historyLoading={v.historyLoading}
            selected={v.alertId}
            onSelect={v.selectAlert}
            a={a}
            forecastLoading={v.waiting || v.simLoading}
            households={v.households}
            simParams={v.simParams}
          />
        </View>
      ) : null}

      <Text variant="bodySmall" color="onSurfaceVariant">
        Simulated pilot: households, alerts and reward rates are simulated or placeholders.
        Delivered is verified kW; participation counts households, not kW.{' '}
        {fraction(v.simParams.amiShare)} smart meters is a simulation assumption.
      </Text>
    </Stack>
  );
}
