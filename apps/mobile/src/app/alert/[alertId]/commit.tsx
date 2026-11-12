import { COMMIT_PRESETS_KW, roundKw } from '@kapitwatt/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, ErrorState, Loading, Screen, SimulatedNote } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { formatKw } from '@/lib/format';
import { useCommit, useMe } from '@/lib/queries';
import { colors, radius, space, text } from '@/theme';

const STEP_KW = 0.1;

/** Commit a cut in kW, never a list of appliances (FR-APP-07, 08). The API enforces the cap too. */
export default function CommitScreen() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const me = useMe();
  const commit = useCommit();
  const [kw, setKw] = useState<number | null>(null);

  if (me.isPending) return <Loading />;
  if (me.isError) return <ErrorState onRetry={() => void me.refetch()} />;

  const cap = me.data.commitCapKw;
  const selected = kw ?? Math.min(1, cap);
  const set = (next: number) => setKw(roundKw(Math.min(cap, Math.max(STEP_KW, next))));

  return (
    <Screen>
      <Card title="How much will you cut?">
        <View style={styles.presets}>
          {COMMIT_PRESETS_KW.map((p) => {
            const disabled = p > cap;
            const active = p === selected;
            return (
              <Pressable
                key={p}
                accessibilityRole="button"
                accessibilityState={{ disabled, selected: active }}
                disabled={disabled}
                onPress={() => set(p)}
                style={[
                  styles.preset,
                  active && styles.presetActive,
                  disabled && styles.presetDisabled,
                ]}
              >
                <Text style={[styles.presetLabel, active && styles.presetLabelActive]}>
                  {formatKw(p)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.stepper}>
          <Button label="-" variant="secondary" onPress={() => set(selected - STEP_KW)} />
          <Text style={styles.figure}>{formatKw(selected)}</Text>
          <Button label="+" variant="secondary" onPress={() => set(selected + STEP_KW)} />
        </View>
        <Text style={styles.body}>Your maximum is {formatKw(cap)}, based on your usual usage.</Text>
      </Card>

      {commit.isError ? <Text style={styles.error}>{commitError(commit.error)}</Text> : null}

      <Button
        label={`Commit ${formatKw(selected)}`}
        loading={commit.isPending}
        disabled={cap <= 0}
        onPress={() =>
          commit.mutate({ alertId, committedKw: selected }, { onSuccess: () => router.back() })
        }
      />
      <SimulatedNote>
        You are paid for the kWh we can verify, at a placeholder rate. Switch off whatever you like;
        nobody checks which appliance.
      </SimulatedNote>
    </Screen>
  );
}

function commitError(e: Error): string {
  if (e instanceof ApiError) {
    const code = (e.body as { error?: string } | null)?.error;
    if (code === 'already_committed') return 'You already committed to this event.';
    if (code === 'window_closed') return 'The peak window has ended.';
    if (code === 'above_cap') return 'That is above your maximum cut.';
  }
  return 'Could not save your commitment. Try again.';
}

const styles = StyleSheet.create({
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  preset: {
    flexGrow: 1,
    minWidth: '22%',
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  presetActive: { borderColor: colors.teal, backgroundColor: colors.teal },
  presetDisabled: { opacity: 0.35 },
  presetLabel: { ...text.body, fontWeight: '700', color: colors.ink },
  presetLabelActive: { color: colors.onDark },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  figure: { ...text.figure, color: colors.ink },
  body: { ...text.body, color: colors.muted },
  error: { ...text.body, color: colors.red },
});
