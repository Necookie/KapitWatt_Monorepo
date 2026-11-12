import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { useState, type CSSProperties } from 'react';
import { View } from 'react-native';
import { toLocalInput } from '@/utils/datetime';
import { clock, dayAndClock } from '@/utils/format';
import { ChoiceChip } from '@/components/ChoiceChip';
import { HOUR, PRESETS } from '../utils/window';
import { DayStrip } from './DayStrip';
import { OptionRow } from './OptionRow';

/**
 * The peak window: quick starts, or a custom date and time; a length; and the day strip. `start` is
 * the `datetime-local` value (local time), as the form keeps it.
 */
export function WindowPicker({
  start,
  onStart,
  hours,
  onHours,
  durations,
}: {
  start: string;
  onStart: (value: string) => void;
  hours: number;
  onHours: (hours: number) => void;
  durations: number[];
}) {
  const t = useTheme();
  const c = t.color;
  const [preset, setPreset] = useState<string>('tonight');
  const startDate = new Date(start);
  const valid = !Number.isNaN(startDate.getTime());
  const endDate = new Date((valid ? startDate.getTime() : Date.now()) + hours * HOUR);

  const input: CSSProperties = {
    height: t.size.controlSm,
    padding: `0 ${t.space[3]}px`,
    border: `1px solid ${c.outline}`,
    borderRadius: t.radius.sm,
    background: c.surfaceContainerLowest,
    color: c.onSurface,
    fontFamily: t.text.bodyMedium.fontFamily,
    fontSize: 14,
  };

  return (
    <View style={{ gap: t.space[4] }}>
      <OptionRow label="Start">
        {PRESETS.map((p) => (
          <ChoiceChip
            key={p.key}
            label={p.label}
            selected={preset === p.key}
            onPress={() => {
              setPreset(p.key);
              onStart(toLocalInput(p.at()));
            }}
          />
        ))}
        <ChoiceChip
          label="Custom"
          selected={preset === 'custom'}
          onPress={() => setPreset('custom')}
        />
        {preset === 'custom' ? (
          <input
            type="datetime-local"
            aria-label="Window start"
            value={start}
            onChange={(e) => onStart(e.target.value)}
            style={input}
          />
        ) : null}
      </OptionRow>
      <OptionRow label="Length">
        {durations.map((h) => (
          <ChoiceChip
            key={h}
            label={`${h} h`}
            accessibilityLabel={`${h} hour window`}
            selected={hours === h}
            onPress={() => onHours(h)}
          />
        ))}
      </OptionRow>
      {valid ? <DayStrip start={startDate} end={endDate} /> : null}
      <Text variant="bodyMedium" color={valid ? 'onSurface' : 'error'}>
        {valid
          ? `${dayAndClock(startDate.toISOString())} to ${clock(endDate.toISOString())} · ${hours} h`
          : 'Enter a start time.'}
      </Text>
    </View>
  );
}
