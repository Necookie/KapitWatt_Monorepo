import { Icon } from '@kapitwatt/icons';
import { POLL_INTERVAL_MS, REWARD, type AlertAnalytics, type AlertStatus } from '@kapitwatt/shared';
import { Card, Chip, SegmentedButtons, Stack, Text, type ChipTone } from '@kapitwatt/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { BarangayMap } from '@/components/analytics/BarangayMap';
import {
  AlertHistoryBars,
  BarangayHeatGrid,
  BarangayRanking,
  CommitDeliverScatter,
  CommitTimeline,
  CostPerKwhTrend,
  Donut,
  PathComparison,
  SmartMeterWhatIf,
  TargetGauge,
  TownTable,
  VerificationFunnel,
  useOutcomeSegments,
} from '@/components/analytics/charts';
import {
  Empty,
  KpiCard,
  Panel,
  Row,
  grow,
  useChartColors,
} from '@/components/analytics/primitives';
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

type Tab = 'overview' | 'verification' | 'barangays' | 'trends';
const VIEWS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'verification', label: 'Verification' },
  { value: 'barangays', label: 'Barangays' },
  { value: 'trends', label: 'Trends' },
];

const STATUS: Record<AlertStatus, { label: string; tone: ChipTone }> = {
  scheduled: { label: 'Scheduled', tone: 'neutral' },
  active: { label: 'Taking commitments', tone: 'primary' },
  window_open: { label: 'Window open', tone: 'primary' },
  settling: { label: 'Settling', tone: 'neutral' },
  settled: { label: 'Settled', tone: 'relief' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

/**
 * Analytics: how an event performed and where verified kW was lost, in four views. Defaults to the
 * current alert, else the most recent; `?alert=<id>` picks any alert and `?view=` the tab, so a view
 * can be linked. Aggregates per barangay only, as everywhere on the dashboard.
 */
export default function AnalyticsScreen() {
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
  const households = sim.data?.simulatedHouseholds || a?.optedInHouseholds || 0;

  return (
    <Stack gap={5}>
      <Stack direction="row" justify="space-between" align="flex-end" gap={4} wrap>
        <Stack gap={2} style={{ flexShrink: 1 }}>
          <Text variant="headlineSmall">Analytics</Text>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            {shown
              ? `Alert of ${dayAndClock(shown.windowStart)}, target ${kw(shown.targetKw)} kW. Refreshes every ${POLL_INTERVAL_MS / 1000} seconds.`
              : 'How an event performed and where verified kW was lost.'}
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
            {a ? <Chip label={STATUS[a.status].label} tone={STATUS[a.status].tone} /> : null}
            <Chip
              label="Simulated pilot"
              tone="simulated"
              icon={<Icon name="simulated" size="sm" color="onSimulatedContainer" />}
            />
          </Stack>
        </Stack>
        <View style={{ flexGrow: 1, flexBasis: 300, maxWidth: 480 }}>
          <SegmentedButtons
            segments={VIEWS}
            value={view}
            onChange={(v) => router.setParams({ view: v })}
            accessibilityLabel="Analytics view"
          />
        </View>
      </Stack>

      {USE_FIXTURES ? (
        <Notice icon="info">
          Analytics need the live API. Fixture mode has no stored history.
        </Notice>
      ) : failed ? (
        <Notice icon="flagged" error>
          {errorMessage(failed)}
        </Notice>
      ) : !alertId && !current.isLoading && !history.isLoading ? (
        <Notice icon="info">No alert yet. Send one, then come back to see how it performs.</Notice>
      ) : null}

      {a ? (
        view === 'overview' ? (
          <Overview
            a={a}
            deliveredAmiKw={totals.data?.deliveredAmiKw}
            deliveredPhotoKw={totals.data?.deliveredPhotoKw}
          />
        ) : view === 'verification' ? (
          <Verification a={a} />
        ) : view === 'barangays' ? (
          <Stack gap={4}>
            <Panel
              title="Pilot map"
              icon="location"
              note="Targeted barangays in the seven Laguna towns, shaded by delivered kW against their share of the target."
            >
              <BarangayMap barangays={totals.data?.barangays ?? []} />
            </Panel>
            <Panel
              title="Share of target by town"
              icon="barangay"
              note="Each tile is a targeted barangay, grouped by town. Delivered kW against its share of the target."
            >
              <BarangayHeatGrid barangays={totals.data?.barangays ?? []} />
            </Panel>
            <Row>
              <Panel
                title="Committed vs delivered"
                icon="chartLine"
                note="Below the line is commitment that was not verified. Point size is households."
                style={grow(480, 3)}
              >
                <CommitDeliverScatter barangays={totals.data?.barangays ?? []} />
              </Panel>
              <Panel
                title="Ranking"
                icon="leaderboard"
                note="Share of target; the tick marks 100%."
                style={grow(420, 2)}
              >
                <BarangayRanking barangays={totals.data?.barangays ?? []} />
              </Panel>
            </Row>
            <Panel title="By town" icon="town">
              <TownTable barangays={totals.data?.barangays ?? []} />
            </Panel>
          </Stack>
        ) : null
      ) : analytics.isLoading ? (
        <Empty>Loading analytics.</Empty>
      ) : null}

      {view === 'trends' ? (
        <Stack gap={4}>
          <Panel
            title="Recent alerts"
            icon="history"
            note="Select an alert to analyse it in the other views."
          >
            <AlertHistoryBars
              alerts={history.data ?? []}
              selected={alertId}
              onSelect={(id) => router.setParams({ alert: id })}
            />
          </Panel>
          <Row>
            <Panel title="Cost per verified kWh" icon="reward" style={grow(420)}>
              <CostPerKwhTrend alerts={history.data ?? []} rate={REWARD.ratePhpPerKwh} />
            </Panel>
            <Panel
              title="What if more households had smart meters?"
              icon="smartMeter"
              style={grow(420)}
            >
              {households > 0 && a ? (
                <SmartMeterWhatIf
                  households={households}
                  params={simParams}
                  targetKw={a.targetKw}
                />
              ) : (
                <Empty>Seed the simulator to see the forecast.</Empty>
              )}
            </Panel>
          </Row>
        </Stack>
      ) : null}

      <Text variant="bodySmall" color="onSurfaceVariant">
        Simulated pilot: households, alerts and reward rates are simulated or placeholders.
        Delivered is verified kW; participation counts households, not kW.{' '}
        {fraction(simParams.amiShare)} smart meters is a simulation assumption.
      </Text>
    </Stack>
  );
}

function Overview({
  a,
  deliveredAmiKw,
  deliveredPhotoKw,
}: {
  a: AlertAnalytics;
  deliveredAmiKw?: number;
  deliveredPhotoKw?: number;
}) {
  const c = useChartColors();
  const settled = a.status === 'settled';
  const paid = a.payouts.creditPhp + a.payouts.bonusPhp;
  const split = deliveredAmiKw !== undefined && deliveredPhotoKw !== undefined;
  return (
    <Stack gap={4}>
      <Row>
        <KpiCard
          label="Committed"
          icon="commit"
          value={kw(a.committedKw)}
          unit="kW"
          caption={`${percent(a.committedKw, a.targetKw)} of the ${kw(a.targetKw)} kW target`}
          progress={{
            share: a.committedKw / Math.max(a.targetKw, 1e-9),
            tone: 'primary',
            label: 'Committed against target',
          }}
        />
        <KpiCard
          label="Delivered"
          icon="energy"
          value={kw(a.deliveredKw)}
          unit="kW"
          caption={`${percent(a.deliveredKw, a.targetKw)} of target, ${settled ? 'settled' : 'live'}`}
          progress={{
            share: a.deliveredKw / Math.max(a.targetKw, 1e-9),
            tone: 'relief',
            label: 'Delivered against target',
          }}
        />
        <KpiCard
          label="Participation"
          icon="home"
          value={percent(a.committedHouseholds, a.optedInHouseholds)}
          caption={`${count(a.committedHouseholds)} of ${count(a.optedInHouseholds)} opted-in households`}
        />
        <KpiCard
          label="Barangays at target"
          icon="barangay"
          value={`${a.barangaysAtTarget}`}
          unit={`of ${a.barangays}`}
          caption="Verified households there earn the bonus"
        />
        <KpiCard
          label="Verified energy"
          icon="verified"
          value={kw(a.verifiedKwh)}
          unit="kWh"
          caption={settled ? 'Paid at settlement' : 'Counted at settlement'}
        />
        <KpiCard
          label="Paid out"
          icon="reward"
          value={paid.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          unit="PHP"
          caption={
            a.payouts.costPerKwhPhp !== null
              ? `${php(a.payouts.costPerKwhPhp)} per kWh · ${count(a.payouts.points)} points`
              : 'After settlement'
          }
        />
      </Row>
      <Row>
        <Panel title="Delivered against target" icon="chartBar" style={grow(300, 2)}>
          <TargetGauge deliveredKw={a.deliveredKw} targetKw={a.targetKw} settled={settled} />
        </Panel>
        <Panel
          title="Delivered by verification path"
          icon="meter"
          note="Smart meters need no photos, so none of their kW is lost to a missed one."
          style={grow(380, 3)}
        >
          {split ? (
            <Donut
              segments={[
                { label: 'Smart meter', value: deliveredAmiKw, color: c.ami },
                { label: 'Meter photo', value: deliveredPhotoKw, color: c.photo },
              ]}
              center={kw(deliveredAmiKw + deliveredPhotoKw)}
              centerCaption="kW delivered"
              format={(v) => `${kw(v)} kW`}
            />
          ) : (
            <Empty>Available once delivery is measured.</Empty>
          )}
        </Panel>
      </Row>
      <Panel
        title="Commitments over time"
        icon="chartLine"
        note="Hover for the committed load at any moment of the commit phase."
      >
        <CommitTimeline timeline={a.timeline} targetKw={a.targetKw} />
      </Panel>
    </Stack>
  );
}

function Verification({ a }: { a: AlertAnalytics }) {
  const settled = a.status === 'settled';
  const outcomes = useOutcomeSegments(a.outcomes);
  const verified = a.outcomes.find((o) => o.outcome === 'verified')?.households ?? 0;
  return (
    <Stack gap={4}>
      <Row>
        <Panel
          title="Verification funnel"
          icon="verified"
          note="Households at each step from commitment to a verified cut."
          style={grow(520, 3)}
        >
          <VerificationFunnel funnel={a.funnel} settled={settled} />
        </Panel>
        <Panel
          title="Outcomes"
          icon="flagged"
          note="What became of every commitment."
          style={grow(380, 2)}
        >
          <Donut
            segments={outcomes}
            center={percent(verified, a.committedHouseholds)}
            centerCaption="verified"
            format={(v) => count(v)}
          />
        </Panel>
      </Row>
      <Panel
        title="Smart meter vs photo"
        icon="smartMeter"
        note={`Photo households earn ${fraction(REWARD.pathMultiplier.photo)} of the rate; smart meters the full ${php(REWARD.ratePhpPerKwh)} per kWh (placeholders).`}
      >
        <PathComparison paths={a.paths} />
      </Panel>
    </Stack>
  );
}

function Notice({
  icon,
  error,
  children,
}: {
  icon: 'info' | 'flagged';
  error?: boolean;
  children: string;
}) {
  return (
    <Card variant="filled" padding={4}>
      <Stack direction="row" align="center" gap={3}>
        <Icon name={icon} size="sm" color={error ? 'error' : 'onSurfaceVariant'} />
        <Text variant="bodyMedium" color={error ? 'error' : 'onSurface'} style={{ flexShrink: 1 }}>
          {children}
        </Text>
      </Stack>
    </Card>
  );
}
