import type { BarangayTotals } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Chip, Text, TextField } from '@kapitwatt/ui';
import { View } from 'react-native';
import { Ring } from '@/components/Ring';
import { count, kw, percent } from '@/utils/format';
import { motion } from '@/styles/motion';
import { FactRow } from './FactRow';

const RING = 64;
const STROKE = 7;

/**
 * One barangay against its own share of the target: a ring for the figure of this stage, whether it
 * is on target (or how far short), and its figures. While editing, the target becomes a field.
 */
export function BarangayCard({
  b,
  measured,
  editing,
  typed,
  onChangeTarget,
}: {
  b: BarangayTotals;
  measured: boolean;
  editing: boolean;
  typed: string;
  onChangeTarget: (text: string) => void;
}) {
  const t = useTheme();
  const value = measured ? b.deliveredKw : b.committedKw;
  const share = b.targetKw > 0 ? value / b.targetKw : 0;
  const reached = measured ? b.targetHit : share >= 1;
  const short = Math.max(0, b.targetKw - value);
  const households =
    b.committedHouseholds !== undefined && b.households !== undefined
      ? ` · ${count(b.committedHouseholds)} of ${count(b.households)} households`
      : '';
  return (
    <View
      style={{
        flex: 1,
        gap: t.space[4],
        padding: t.space[4],
        borderRadius: t.radius.md,
        backgroundColor: t.color.surfaceContainerLow,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
        <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
          <Ring
            share={share}
            color={measured ? t.dataViz.delivered : t.dataViz.committed}
            track={t.color.surfaceContainerHighest}
            size={RING}
            stroke={STROKE}
          />
          <Text variant="labelMedium" style={{ fontVariant: ['tabular-nums'] }}>
            {percent(value, b.targetKw)}
          </Text>
          {/* Mounts when the barangay reaches its target, so it pops in at that moment. */}
          {reached ? (
            <View
              style={[
                {
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 22,
                  height: 22,
                  borderRadius: t.radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: t.color.surfaceContainerLow,
                  backgroundColor: measured ? t.dataViz.delivered : t.dataViz.committed,
                },
                motion.pop,
              ]}
            >
              <Icon name="check" weight="bold" size="sm" color={t.color.onPrimary} />
            </View>
          ) : null}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: t.space[1], alignItems: 'flex-start' }}>
          <Text variant="titleMedium" numberOfLines={1}>
            {b.name}
          </Text>
          {measured ? (
            reached ? (
              <Chip
                label="Target hit"
                tone="relief"
                icon={<Icon name="check" size="sm" color="onReliefContainer" />}
              />
            ) : (
              <Chip label={`${kw(Math.round(short * 10) / 10)} kW short`} />
            )
          ) : reached ? (
            <Chip label="Commitments cover it" tone="primary" />
          ) : (
            <Chip label={`${kw(Math.round(short * 10) / 10)} kW to go`} />
          )}
        </View>
      </View>

      {editing ? (
        <TextField
          label={`Target for ${b.name}`}
          inputMode="decimal"
          suffix="kW"
          value={typed}
          onChangeText={onChangeTarget}
        />
      ) : null}

      <View style={{ gap: t.space[2] }}>
        {editing ? null : <FactRow label="Target" value={`${kw(b.targetKw)} kW`} />}
        <FactRow label="Committed" value={`${kw(b.committedKw)} kW${households}`} />
        <FactRow
          label="Delivered"
          value={measured ? `${kw(b.deliveredKw)} kW` : 'After the window'}
          muted={!measured}
        />
        {measured && b.deliveredAmiKw !== undefined && b.deliveredPhotoKw !== undefined ? (
          <FactRow
            label="By path"
            value={`smart meter ${kw(b.deliveredAmiKw)} · photo ${kw(b.deliveredPhotoKw)} kW`}
          />
        ) : null}
      </View>
    </View>
  );
}
