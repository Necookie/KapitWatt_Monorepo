import { Icon } from '@kapitwatt/icons';
import { COMMIT_PRESETS_KW, roundKw, TRUST } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { Button, ErrorState, Loading, Screen } from '@/components/ui';
import { describeError } from '@/lib/api';
import { formatKw, formatWindow } from '@/lib/format';
import { useAlert, useCommit, useMe } from '@/lib/queries';
import { fonts, radius, space } from '@/theme';

const c = themes.light.color;
const STEP_KW = 0.1;

/**
 * Commit a cut in kW, never a list of appliances (FR-APP-07, 08; mockup "Commit a cut").
 * The API enforces the cap too.
 */
export default function CommitScreen() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const me = useMe();
  const alert = useAlert(alertId);
  const commit = useCommit();
  const [kw, setKw] = useState<number | null>(null);

  if (me.isPending || alert.isPending) return <Loading />;
  if (me.isError || alert.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void me.refetch();
          void alert.refetch();
        }}
      />
    );
  }

  const cap = me.data.commitCapKw ?? 0;
  const selected = kw ?? Math.min(1, cap);
  const set = (next: number) => setKw(roundKw(Math.min(cap, Math.max(STEP_KW, next))));
  const { windowStart, windowEnd } = alert.data.alert;

  return (
    <Screen roomy>
      <MascotHeader
        label="Commit a cut"
        line={`How much can you cut, ${formatWindow(windowStart, windowEnd)}?`}
      />

      <View style={styles.stepper}>
        <RoundButton
          icon="remove"
          label={`Less, by ${formatKw(STEP_KW)}`}
          disabled={selected <= STEP_KW}
          onPress={() => set(selected - STEP_KW)}
        />
        <View style={styles.figure} accessibilityLiveRegion="polite">
          <Text style={styles.figureNumber}>{selected.toFixed(1)}</Text>
          <Text variant="headlineSmall" color="onSurfaceVariant">
            kW
          </Text>
        </View>
        <RoundButton
          icon="add"
          label={`More, by ${formatKw(STEP_KW)}`}
          disabled={selected >= cap}
          onPress={() => set(selected + STEP_KW)}
        />
      </View>

      <View style={styles.segments} accessibilityRole="radiogroup" accessibilityLabel="Quick picks">
        {COMMIT_PRESETS_KW.map((p, i) => {
          const disabled = p > cap;
          const active = p === selected;
          return (
            <Pressable
              key={p}
              accessibilityRole="radio"
              accessibilityState={{ disabled, checked: active }}
              accessibilityLabel={formatKw(p)}
              disabled={disabled}
              onPress={() => set(p)}
              style={[
                styles.segment,
                i < COMMIT_PRESETS_KW.length - 1 && styles.segmentDivider,
                active && styles.segmentOn,
              ]}
            >
              {active ? (
                <Icon name="check" size="sm" weight="bold" color="onSecondaryContainer" />
              ) : null}
              <Text
                variant="titleSmall"
                style={{
                  color: disabled ? c.outline : active ? c.onSecondaryContainer : c.onSurface,
                }}
              >
                {String(p)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelRow}>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            Most you can commit
          </Text>
          <Text variant="titleSmall">{formatKw(cap)}</Text>
        </View>
        <View style={styles.panelRow}>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            If your cut is verified
          </Text>
          <Text variant="titleSmall" color="tertiary">
            {`+${TRUST.cleanEvent} Contribution Score`}
          </Text>
        </View>
        <Text variant="bodySmall" color="onSurfaceVariant">
          Switch off whatever you like. Nobody checks which appliance.
        </Text>
      </View>

      <View style={styles.actions}>
        {commit.isError ? <Text color="error">{commitError(commit.error)}</Text> : null}
        <Button
          label={`Commit ${formatKw(selected)}`}
          loading={commit.isPending}
          disabled={cap <= 0}
          onPress={() =>
            commit.mutate({ alertId, committedKw: selected }, { onSuccess: () => router.back() })
          }
        />
      </View>
    </Screen>
  );
}

/** The round outlined − and + buttons beside the figure. */
function RoundButton(props: {
  icon: 'add' | 'remove';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityState={{ disabled: props.disabled }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.round,
        props.disabled && styles.roundOff,
        pressed && styles.roundPressed,
      ]}
    >
      <Icon name={props.icon} weight="bold" color={props.disabled ? 'outline' : 'primary'} />
    </Pressable>
  );
}

/** Refusals the household can act on; anything else shows the server's sentence. */
const COMMIT_REFUSALS: Record<string, string> = {
  already_committed: 'You already committed to this event.',
  window_closed: 'Commitments closed when the peak window started.',
  alert_closed: 'This event is over.',
  above_cap: 'That is above your maximum cut.',
  needs_rehearsal: 'Finish your practice run first, so we know your usual usage.',
  no_baseline: 'We do not have your usual usage yet, so you cannot commit.',
  opted_out: 'Grid alerts are turned off for you. Turn them on in Profile to join.',
  not_targeted: 'This alert is not for your barangay.',
};

function commitError(e: Error): string {
  return describeError(e, COMMIT_REFUSALS, 'Could not save your commitment. Try again.');
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
  },
  figure: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  figureNumber: {
    fontFamily: fonts.semibold,
    fontSize: 64,
    lineHeight: 72,
    color: c.onSurface,
    fontVariant: ['tabular-nums'],
  },
  round: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: c.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundOff: { borderColor: c.outlineVariant },
  roundPressed: { backgroundColor: c.surfaceContainerHigh },
  segments: {
    flexDirection: 'row',
    height: 48,
    borderWidth: 1,
    borderColor: c.outline,
    borderRadius: 24,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  segmentDivider: { borderRightWidth: 1, borderRightColor: c.outline },
  segmentOn: { backgroundColor: c.secondaryContainer },
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    padding: space.lg,
    gap: space.sm,
  },
  panelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actions: { marginTop: 'auto', gap: space.sm },
});
