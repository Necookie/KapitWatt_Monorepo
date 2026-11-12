import { memo } from 'react';
import { useTheme } from '@kapitwatt/hooks';
import type { BarangayWithCount } from '@kapitwatt/shared';
import { about } from '@/utils/format';
import { FigureTile } from '@/components/FigureTile';
import { TileStack } from '@/components/TileStack';
import { Split } from '@/components/Split';
import { CalmHero } from './CalmHero';
import { Coverage } from './Coverage';
import { EventSteps } from './EventSteps';

/**
 * No alert in force: the pilot is ready, not empty. The same indigo hero as an event, the pilot's
 * figures, how an event runs, and the towns an alert can reach.
 */
export const Readiness = memo(function Readiness({
  demo,
  wide,
  households,
  barangays,
}: {
  demo: boolean;
  /** Bento: hero beside its figures and the steps beside "committed now"; stacked otherwise. */
  wide: boolean;
  /** Opted-in households; undefined when the API does not report it (unknown is not zero). */
  households?: number;
  barangays: BarangayWithCount[];
}) {
  const t = useTheme();
  const c = t.color;
  const towns = new Set(barangays.map((b) => b.municipality)).size;
  return (
    <>
      <Split wide={wide}>
        <CalmHero demo={demo} />
        <TileStack
          lead={{
            label: 'Opted-in households',
            icon: 'home',
            value: households === undefined ? undefined : about(households).replace('about ', '≈ '),
            unit: '',
            note:
              households === undefined
                ? 'Not reported by the API yet'
                : 'Simulated, plus team phones',
            bg: c.primaryContainer,
            fg: c.onPrimaryContainer,
          }}
          pair={[
            {
              label: 'Coverage',
              icon: 'town',
              value: String(towns),
              unit: 'towns',
              note: 'Laguna franchise area',
              bg: c.tertiaryContainer,
              fg: c.onTertiaryContainer,
            },
            {
              label: 'Barangays',
              icon: 'barangay',
              value: String(barangays.length),
              unit: '',
              note: 'Results per barangay',
              bg: c.secondaryContainer,
              fg: c.onSecondaryContainer,
            },
          ]}
        />
      </Split>
      <Split wide={wide}>
        <EventSteps />
        <FigureTile
          label="Committed now"
          icon="commit"
          value="0"
          size="lg"
          note="Nothing asked of households yet. Send an alert to start an event."
          bg={c.surfaceContainerLowest}
          fg={c.onSurface}
          dashed
        />
      </Split>
      <Coverage barangays={barangays} />
    </>
  );
});
