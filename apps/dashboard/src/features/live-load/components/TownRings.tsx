import { memo } from 'react';
import { Text } from '@kapitwatt/ui';
import type { TownTotals } from '@/utils/format';
import { Grid } from '@/components/Grid';
import { Panel } from '@/components/Panel';
import { TownCard } from './TownCard';

/** Towns as rings, furthest along first; each opens its barangays. */
export const TownRings = memo(function TownRings({
  towns,
  measured,
}: {
  towns: TownTotals[];
  measured: boolean;
}) {
  const ranked = [...towns].sort((a, b) => {
    const pa = (measured ? a.deliveredKw : a.committedKw) / Math.max(a.targetKw, 1);
    const pb = (measured ? b.deliveredKw : b.committedKw) / Math.max(b.targetKw, 1);
    return pb - pa;
  });
  return (
    <Panel
      title="Towns"
      subtitle={
        measured
          ? 'Verified delivered kW against each town’s share of the target'
          : 'Committed kW against each town’s share of the target'
      }
    >
      {ranked.length === 0 ? (
        <Text variant="bodyMedium" color="onSurfaceVariant">
          Waiting for the first totals.
        </Text>
      ) : (
        <Grid min={220}>
          {ranked.map((town) => (
            <TownCard key={town.town} town={town} measured={measured} />
          ))}
        </Grid>
      )}
    </Panel>
  );
});
