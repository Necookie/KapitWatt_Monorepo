import type { CSSProperties, ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, font, radius, space } from '@/theme';
import { Label, Txt } from './ui';

/**
 * Form controls. The dashboard is web only (app.json: platforms ["web"]), so the
 * range slider and the date-time picker use the browser's own inputs.
 */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      {children}
      {hint ? (
        <Txt size="xs" tone="muted">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

export function TextField({
  value,
  onChangeText,
  multiline,
  width,
  numeric,
  label,
}: {
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  width?: number;
  numeric?: boolean;
  label: string;
}) {
  return (
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      inputMode={numeric ? 'decimal' : 'text'}
      style={[
        styles.input,
        multiline ? styles.multiline : null,
        width ? { width } : null,
        numeric ? { fontVariant: ['tabular-nums'] } : null,
      ]}
    />
  );
}

/** A small set of mutually exclusive choices. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
              styles.segment,
              i > 0 ? styles.segmentDivider : null,
              hovered && !selected ? { backgroundColor: colors.surfaceAlt } : null,
              selected ? styles.segmentSelected : null,
            ]}
          >
            <Txt
              size="sm"
              weight={selected ? '600' : '500'}
              style={{ color: selected ? colors.brandStrong : colors.body }}
            >
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Checkbox({
  checked,
  mixed,
  onChange,
  label,
  strong,
}: {
  checked: boolean;
  /** Some, but not all, of the children are selected. */
  mixed?: boolean;
  onChange: (next: boolean) => void;
  label: string;
  strong?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: mixed ? 'mixed' : checked }}
      onPress={() => onChange(!checked)}
      style={styles.checkRow}
    >
      <View style={[styles.box, checked || mixed ? styles.boxOn : null]}>
        {checked || mixed ? (
          <Txt size="xs" weight="700" style={{ color: '#FFFFFF', lineHeight: 12 }}>
            {mixed ? '–' : '✓'}
          </Txt>
        ) : null}
      </View>
      <Txt size="sm" tone={strong ? 'ink' : 'body'} weight={strong ? '600' : '400'}>
        {label}
      </Txt>
    </Pressable>
  );
}

/**
 * Inline styles cannot reach the slider thumb, so its rules are added to the page once.
 * The filled part of the track is drawn per slider with a gradient (see `Slider`).
 */
const RANGE_CSS = `
.kw-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; margin: 8px 0;
  border-radius: 2px; outline-offset: 4px; cursor: pointer; }
.kw-range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px;
  border-radius: 7px; background: ${colors.surface}; border: 2px solid ${colors.brandStrong}; }
.kw-range::-moz-range-thumb { width: 10px; height: 10px; border-radius: 7px;
  background: ${colors.surface}; border: 2px solid ${colors.brandStrong}; }
`;

function ensureRangeCss(): void {
  if (typeof document === 'undefined' || document.getElementById('kw-range-css')) return;
  const style = document.createElement('style');
  style.id = 'kw-range-css';
  style.textContent = RANGE_CSS;
  document.head.appendChild(style);
}

/** A labelled range slider with its current value on the right. */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  hint?: string;
}) {
  ensureRangeCss();
  const filled = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const track: CSSProperties = {
    background: `linear-gradient(to right, ${colors.brand} ${filled}%, ${colors.track} ${filled}%)`,
  };
  return (
    <View style={{ gap: 2 }}>
      <View style={styles.sliderHead}>
        <Txt size="sm" tone="ink" weight="500">
          {label}
        </Txt>
        <Txt size="sm" tone="ink" weight="600" numeric>
          {format(value)}
        </Txt>
      </View>
      <input
        type="range"
        className="kw-range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={track}
      />
      {hint ? (
        <Txt size="xs" tone="muted">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

const dateStyle: CSSProperties = {
  height: 32,
  padding: '0 8px',
  border: `1px solid ${colors.borderStrong}`,
  borderRadius: radius.md,
  fontFamily: font.family,
  fontSize: font.md,
  color: colors.ink,
  background: colors.surface,
  boxSizing: 'border-box',
};

/** Local date and time, as the browser's `datetime-local` value (YYYY-MM-DDTHH:mm). */
export function DateTimeField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <input
      type="datetime-local"
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={dateStyle}
    />
  );
}

/** `Date` to the value a `datetime-local` input expects, in local time. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

const styles = StyleSheet.create({
  input: {
    height: 32,
    paddingHorizontal: space.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    fontFamily: font.family,
    fontSize: font.md,
    color: colors.ink,
  },
  multiline: { height: 84, paddingVertical: space.sm, lineHeight: 18 },
  segmented: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  segment: { height: 30, paddingHorizontal: space.md, justifyContent: 'center' },
  segmentDivider: { borderLeftWidth: 1, borderLeftColor: colors.borderStrong },
  segmentSelected: { backgroundColor: colors.brandSoft },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 24 },
  box: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.brandStrong, borderColor: colors.brandStrong },
  sliderHead: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
});
