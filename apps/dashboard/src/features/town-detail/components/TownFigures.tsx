import { View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { count, kw, percent, type TownTotals } from '@/utils/format';

export function TownFigures({ town, measured }: { town: TownTotals; measured: boolean }) {
  return (
    <Card padded={false}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Stat label="Town target" value={kw(town.targetKw)} unit="kW" />
        <Stat
          label="Committed"
          value={kw(town.committedKw)}
          unit="kW"
          note={
            town.householdsKnown
              ? `${percent(town.committedKw, town.targetKw)} of target · ${count(
                  town.committedHouseholds,
                )} of ${count(town.households)} households`
              : `${percent(town.committedKw, town.targetKw)} of target`
          }
        />
        <Stat
          label="Delivered, verified"
          value={measured ? kw(town.deliveredKw) : '—'}
          unit={measured ? 'kW' : undefined}
          note={
            measured
              ? `${percent(town.deliveredKw, town.targetKw)} of target · smart meter ${kw(
                  town.deliveredAmiKw,
                )} kW, photo ${kw(town.deliveredPhotoKw)} kW`
              : 'Measured after the window ends'
          }
        />
        <Stat
          label="Barangays on target"
          value={measured ? String(town.barangaysHit) : '—'}
          unit={measured ? `of ${town.barangays.length}` : undefined}
        />
      </View>
    </Card>
  );
}
