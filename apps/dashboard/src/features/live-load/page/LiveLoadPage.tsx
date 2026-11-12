import { useTheme } from '@kapitwatt/hooks';
import { View } from 'react-native';
import { Panel } from '@/components/Panel';
import { Split } from '@/components/Split';
import { ReliefWaterfall } from '@/components/relief-waterfall/ReliefWaterfall';
import { Notice } from '@/components/ui/Notice';
import { useLayoutValue } from '@/hooks/useLayoutValue';
import { errorMessage } from '@/api/client';
import { CommitTimeline } from '../components/CommitTimeline';
import { DemoStrip } from '../components/DemoStrip';
import { FigureTiles } from '../components/FigureTiles';
import { LiveHero } from '../components/LiveHero';
import { LoadCurvePanel } from '../components/LoadCurvePanel';
import { Readiness } from '../components/Readiness';
import { TownDetailsTable } from '../components/TownDetailsTable';
import { TownRings } from '../components/TownRings';
import { useLiveLoadFigures } from '../hooks/useLiveLoadFigures';

/**
 * Live load, as a bento grid: the indigo hero (level, window, the figure for this stage, stages, gauge
 * and countdown) beside committed, forecast and delivered; where the relief goes beside commitments
 * coming in (the load curve once the window has ended); towns; demo controls; the full table. With no
 * alert, the readiness bento.
 */
export default function LiveLoadPage() {
  const t = useTheme();
  // Hero beside its figures from about a laptop's page width; charts side by side from a tablet's.
  const [size, onLayout] = useLayoutValue((w) => (w >= 960 ? 'wide' : w >= 720 ? 'mid' : 'narrow'));
  const heroBeside = size === 'wide';
  const chartsBeside = size !== 'narrow';
  const {
    alert,
    totals,
    barangays,
    params,
    demo,
    towns,
    status,
    measured,
    failed,
    target,
    committed,
    delivered,
    forecast,
    barangayRows,
    barangaysHit,
    committing,
    samples,
    householdsKnown,
    pilotHouseholds,
  } = useLiveLoadFigures();

  return (
    // Bento: blocks sit side by side by the width the page has, stacked on narrow screens.
    <View onLayout={onLayout} style={{ gap: t.space[4] }}>
      {failed ? <Notice tone="critical">{errorMessage(failed)}</Notice> : null}

      {alert.data && status ? (
        <>
          <Split wide={heroBeside}>
            {/* Keyed by alert: a half-confirmed cancel must never carry over to the next alert. */}
            <LiveHero
              key={alert.data.id}
              alert={alert.data}
              status={status}
              target={target}
              committed={committed}
              forecast={forecast}
              delivered={delivered}
              households={totals.data?.committedHouseholds}
              barangays={barangayRows.length || alert.data.targetBarangayIds.length}
            />
            <FigureTiles
              target={target}
              committed={committed}
              forecast={forecast}
              delivered={delivered}
              measured={measured}
              barangays={barangayRows.length || alert.data.targetBarangayIds.length}
              barangaysHit={barangaysHit}
            />
          </Split>

          <Split wide={chartsBeside} ratio={[7, 5]}>
            <ReliefWaterfall
              target={target}
              committed={committed}
              delivered={delivered}
              deliveredAmi={totals.data?.deliveredAmiKw ?? 0}
              deliveredPhoto={totals.data?.deliveredPhotoKw ?? 0}
              measured={measured}
              params={params}
            />
            {committing ? (
              <CommitTimeline samples={samples} target={target} />
            ) : (
              <LoadCurvePanel
                windowStart={alert.data.windowStart}
                windowEnd={alert.data.windowEnd}
                baselineKw={totals.data?.baselineKw}
                forecastKw={forecast}
                deliveredKw={delivered}
                measured={measured}
                params={params}
              />
            )}
          </Split>

          <TownRings towns={towns} measured={measured} />

          {demo ? <DemoStrip alert={alert.data} status={status} /> : null}

          <Panel title="Details by town" subtitle="Figures in kW. Open a town for its barangays.">
            <TownDetailsTable towns={towns} measured={measured} />
          </Panel>
        </>
      ) : (
        <Readiness
          loading={alert.isLoading}
          demo={demo}
          wide={heroBeside}
          households={householdsKnown ? pilotHouseholds : undefined}
          barangays={barangays.data ?? []}
        />
      )}
    </View>
  );
}
