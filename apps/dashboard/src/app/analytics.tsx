import { POLL_INTERVAL_MS } from '@kapitwatt/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  AlertHistoryChart,
  BarangayRanking,
  CommitTimeline,
  OutcomeBreakdown,
  SmartMeterWhatIf,
  VerificationFunnel,
} from '@/components/analytics-charts';
import { Card, Notice, PageHeader, Stat, Txt } from '@/components/ui';
import { errorMessage, USE_FIXTURES } from '@/lib/client';
import { count, dayAndClock, fraction, kw, percent, php } from '@/lib/format';
import {
  useAlertHistory,
  useAnalytics,
  useCurrentAlert,
  useSimStatus,
  useTotals,
} from '@/lib/queries';
import { useSimParams } from '@/lib/sim-params';
import { space } from '@/theme';

/**
 * Analytics: how an event performed and where verified kW was lost. Defaults to the current alert;
 * `?alert=<id>` (or a click in the history chart) shows any past alert. Aggregates per barangay
 * only, as everywhere on the dashboard.
 */
export default function AnalyticsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ alert?: string }>();
  const current = useCurrentAlert();
  const history = useAlertHistory();
  // The alert in the URL, else the current one, else the most recent (a settled alert is no longer
  // "current", but it is the one an operator wants to analyse).
  const alertId = params.alert ?? current.data?.id ?? history.data?.[0]?.alertId;

  const analytics = useAnalytics(alertId);
  const totals = useTotals(alertId);
  const sim = useSimStatus();
  const { params: simParams } = useSimParams();

  const a = analytics.data;
  const settled = a?.status === 'settled';
  const failed = analytics.error ?? history.error;
  const paid = a ? a.payouts.creditPhp + a.payouts.bonusPhp : 0;
  const households = sim.data?.simulatedHouseholds || a?.optedInHouseholds || 0;
  const shown = history.data?.find((h) => h.alertId === alertId);

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle={
          shown
            ? `Alert of ${dayAndClock(shown.windowStart)} · ${shown.status.replace('_', ' ')}. Refreshes every ${POLL_INTERVAL_MS / 1000} seconds.`
            : 'How an event performed and where verified kW was lost.'
        }
      />

      {USE_FIXTURES ? (
        <Notice tone="warning">
          Analytics need the live API. Fixture mode has no stored history.
        </Notice>
      ) : failed ? (
        <Notice tone="critical">{errorMessage(failed)}</Notice>
      ) : null}

      {!alertId && !current.isLoading && !history.isLoading ? (
        <Notice tone="neutral">
          No alert yet. Send one, then come back to see how it performs.
        </Notice>
      ) : null}

      {a ? (
        <>
          <Card padded={false}>
            <View style={styles.kpis}>
              <Stat
                label="Committed"
                value={kw(a.committedKw)}
                unit="kW"
                note={`${percent(a.committedKw, a.targetKw)} of the ${kw(a.targetKw)} kW target`}
              />
              <Stat
                label="Delivered"
                value={kw(a.deliveredKw)}
                unit="kW"
                note={`${percent(a.deliveredKw, a.targetKw)} of target${settled ? ', settled' : ', live'}`}
              />
              <Stat
                label="Participation"
                value={percent(a.committedHouseholds, a.optedInHouseholds)}
                note={`${count(a.committedHouseholds)} of ${count(a.optedInHouseholds)} opted-in households`}
              />
              <Stat
                label="Barangays at target"
                value={`${a.barangaysAtTarget}/${a.barangays}`}
                note="Each verified household there earns the bonus"
              />
              <Stat
                label="Verified energy"
                value={kw(a.verifiedKwh)}
                unit="kWh"
                note={settled ? 'Paid at settlement' : 'Counted at settlement'}
              />
              <Stat
                label="Paid out"
                value={paid.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                unit="PHP"
                note={
                  a.payouts.costPerKwhPhp !== null
                    ? `${php(a.payouts.costPerKwhPhp)} per verified kWh · ${count(a.payouts.points)} points`
                    : 'After settlement'
                }
              />
            </View>
          </Card>

          <View style={styles.grid}>
            <Card title="Verification funnel" style={styles.wide}>
              <VerificationFunnel funnel={a.funnel} settled={settled} />
            </Card>
            <Card title="Outcomes" style={styles.narrow}>
              <OutcomeBreakdown outcomes={a.outcomes} />
            </Card>
          </View>

          <Card title="Commitments over time">
            <CommitTimeline timeline={a.timeline} targetKw={a.targetKw} />
          </Card>

          <View style={styles.grid}>
            <Card title="Barangays by share of target" style={styles.half}>
              <BarangayRanking barangays={totals.data?.barangays ?? []} />
            </Card>
            <Card title="What if more households had smart meters?" style={styles.half}>
              {households > 0 ? (
                <SmartMeterWhatIf
                  households={households}
                  params={simParams}
                  targetKw={a.targetKw}
                />
              ) : (
                <Txt size="sm" tone="muted">
                  Seed the simulator to see the forecast.
                </Txt>
              )}
            </Card>
          </View>
        </>
      ) : analytics.isLoading ? (
        <Txt size="sm" tone="muted">
          Loading analytics.
        </Txt>
      ) : null}

      <Card
        title="Recent alerts"
        aside={
          <Txt size="xs" tone="muted">
            Select one to analyse it
          </Txt>
        }
      >
        <AlertHistoryChart
          alerts={history.data ?? []}
          selected={alertId}
          onSelect={(id) => router.setParams({ alert: id })}
        />
      </Card>

      <Txt size="xs" tone="muted">
        Simulated pilot: households, alerts and reward rates are simulated or placeholders.
        Delivered is verified kW; participation counts households, not kW.{' '}
        {fraction(simParams.amiShare)} smart meters is a simulation assumption.
      </Txt>
    </>
  );
}

const styles = StyleSheet.create({
  kpis: { flexDirection: 'row', flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  wide: { flexGrow: 3, flexBasis: 520, minWidth: 320 },
  narrow: { flexGrow: 2, flexBasis: 300, minWidth: 280 },
  half: { flexGrow: 1, flexBasis: 420, minWidth: 320 },
});
