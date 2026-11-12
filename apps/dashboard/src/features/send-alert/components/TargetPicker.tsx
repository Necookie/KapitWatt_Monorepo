import type { SimParams } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { expectedOutcome } from '@kapitwatt/sim';
import { Text } from '@kapitwatt/ui';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { fraction, kw, percent } from '@/utils/format';
import { ChoiceChip } from '@/components/ChoiceChip';
import { KW_PER, PRESETS_KW, type TargetUnit } from '../utils/alert-defaults';
import { OptionRow } from './OptionRow';

/**
 * Target relief: one large figure, presets, and the unit. Under it the forecast for the areas picked,
 * from the simulation's assumptions, so the operator sees whether the target is within reach.
 */
export function TargetPicker({
  text,
  onText,
  unit,
  onUnit,
  targetKw,
  households,
  params,
}: {
  text: string;
  onText: (text: string) => void;
  unit: TargetUnit;
  onUnit: (unit: TargetUnit) => void;
  targetKw: number;
  /** Opted-in households in the areas picked; undefined when the API does not report counts. */
  households?: number;
  params: SimParams;
}) {
  const t = useTheme();
  const c = t.color;
  const [focused, setFocused] = useState(false);
  const outcome = households !== undefined ? expectedOutcome(households, params) : undefined;
  const reachable = outcome !== undefined && targetKw > 0 && outcome.deliveredKw >= targetKw;
  return (
    <View style={{ gap: t.space[4] }}>
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: t.space[3] }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: t.space[2],
            paddingHorizontal: t.space[4],
            paddingVertical: t.space[2],
            borderRadius: t.radius.md,
            borderWidth: t.borderWidth.hairline,
            borderColor: focused ? c.primary : c.outline,
            backgroundColor: c.surfaceContainerLowest,
            // Focus: a second pixel outside the border, so the box does not change size.
            ...(focused
              ? { outlineStyle: 'solid' as const, outlineWidth: 1, outlineColor: c.primary }
              : null),
          }}
        >
          <TextInput
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            accessibilityLabel={`Target in ${unit}`}
            inputMode="decimal"
            value={text}
            onChangeText={(v) => onText(v.replace(/[^0-9.]/g, ''))}
            style={[
              t.text.dataMedium,
              { color: c.onSurface, width: 104, outlineWidth: 0, outlineStyle: 'none' } as object,
            ]}
          />
          <Text variant="titleMedium" color="onSurfaceVariant">
            {unit}
          </Text>
        </View>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Target unit"
          style={{ flexDirection: 'row', gap: t.space[2] }}
        >
          {(['kW', 'MW'] as const).map((u) => (
            <ChoiceChip key={u} label={u} selected={unit === u} onPress={() => onUnit(u)} />
          ))}
        </View>
      </View>
      <OptionRow label="Presets">
        {PRESETS_KW.map((p) => (
          <ChoiceChip
            key={p}
            label={`${kw(p)} kW`}
            selected={targetKw === p}
            onPress={() => onText(String(p / KW_PER[unit]))}
          />
        ))}
      </OptionRow>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: t.space[3],
          padding: t.space[3],
          borderRadius: t.radius.md,
          borderWidth: t.borderWidth.hairline,
          borderStyle: 'dashed',
          borderColor: c.outline,
        }}
      >
        <Icon name="chartLine" size="sm" color="onSurfaceVariant" />
        <View style={{ flex: 1, gap: t.space[0.5] }}>
          {outcome ? (
            <>
              <Text variant="bodyMedium">
                Forecast: about{' '}
                <Text variant="titleSmall">{kw(Math.round(outcome.deliveredKw))} kW</Text> verified
                {targetKw > 0 ? ` (${percent(outcome.deliveredKw, targetKw)} of target)` : ''}, from{' '}
                {kw(Math.round(outcome.committedKw))} kW committed.
              </Text>
              <Text
                variant="bodySmall"
                color={reachable ? 'onReliefContainer' : 'onSurfaceVariant'}
              >
                {targetKw > 0
                  ? reachable
                    ? 'Within reach with these areas.'
                    : 'Likely short: add areas or lower the target.'
                  : ''}{' '}
                Assumes {fraction(params.participation)} participation, {params.cutKw} kW each,{' '}
                {fraction(params.followThrough)} follow-through.
              </Text>
            </>
          ) : (
            <Text variant="bodySmall" color="onSurfaceVariant">
              The forecast needs household counts, which the API has not reported.
            </Text>
          )}
          <Text variant="bodySmall" color="onSurfaceVariant">
            The target is split across the barangays by opted-in households.
          </Text>
        </View>
      </View>
    </View>
  );
}
