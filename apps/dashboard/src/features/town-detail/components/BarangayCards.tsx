import type { BarangayTotals } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Button } from '@kapitwatt/ui';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Grid } from '@/components/Grid';
import { Panel } from '@/components/Panel';
import { BarangayCard } from './BarangayCard';

/** The town's barangays as cards, with Edit targets while the API still accepts overrides. */
export function BarangayCards({
  rows,
  measured,
  editable,
  editing,
  typed,
  onChangeTarget,
  onEdit,
  editBar,
}: {
  rows: BarangayTotals[];
  measured: boolean;
  editable: boolean;
  editing: boolean;
  typed: (b: BarangayTotals) => string;
  onChangeTarget: (b: BarangayTotals, text: string) => void;
  onEdit: () => void;
  /** Shown under the cards while editing: the sum and Cancel / Save. */
  editBar: ReactNode;
}) {
  const t = useTheme();
  return (
    <Panel
      title="Barangays"
      subtitle={
        measured
          ? 'Verified delivered kW against each barangay’s own share of the target'
          : 'Committed kW against each barangay’s own share of the target'
      }
      aside={
        editable && !editing ? (
          <Button label="Edit targets" variant="outlined" onPress={onEdit} />
        ) : undefined
      }
    >
      <View style={{ gap: t.space[4] }}>
        <Grid min={260} columns={[3, 2, 1]}>
          {rows.map((b) => (
            <BarangayCard
              key={b.barangayId}
              b={b}
              measured={measured}
              editing={editing}
              typed={typed(b)}
              onChangeTarget={(text) => onChangeTarget(b, text)}
            />
          ))}
        </Grid>
        {editing ? editBar : null}
      </View>
    </Panel>
  );
}
