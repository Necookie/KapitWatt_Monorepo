import { useTheme } from '@kapitwatt/hooks';
import { memo } from 'react';
import { View } from 'react-native';
import { FigureTile } from '@/components/FigureTile';
import { Tally } from '@/components/Tally';
import { count, kw, percent, type TownTotals } from '@/utils/format';
import { PathSplitTile } from './PathSplitTile';

const round = (n: number) => kw(Math.round(n));

/** Beside the hero: committed against the town's share (and its households), and delivery by path. */
export const TownTiles = memo(function TownTiles({
  town,
  measured,
}: {
  town: TownTotals;
  measured: boolean;
}) {
  const t = useTheme();
  const c = t.color;
  const scale = Math.max(town.targetKw, town.committedKw, 1);
  return (
    <View style={{ flex: 1, gap: t.space[3] }}>
      {/* Its own height (the tile is flex: 1 inside); the path tile takes what is left. */}
      <View>
        <FigureTile
          label="Committed"
          icon="commit"
          size="lg"
          value={<Tally value={town.committedKw} format={round} />}
          note={
            town.householdsKnown
              ? `${percent(town.committedKw, town.targetKw)} of the share · ${count(town.committedHouseholds)} of ${count(town.households)} households`
              : `${percent(town.committedKw, town.targetKw)} of the share`
          }
          progress={{
            value: town.committedKw / scale,
            target: town.targetKw / scale,
            label: 'Committed against the town’s share',
          }}
          bg={c.primaryContainer}
          fg={c.onPrimaryContainer}
        />
      </View>
      <PathSplitTile
        measured={measured}
        amiKw={town.deliveredAmiKw}
        photoKw={town.deliveredPhotoKw}
      />
    </View>
  );
});
