import { contributionDelta, SETTLEMENT_DELAY_MIN, type ZeroPayoutReason } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { Button, ErrorState, Loading, Screen } from '@/components/ui';
import { formatKw, formatKwh } from '@/lib/format';
import { formatScoreChange } from '@/lib/perks';
import { useResult } from '@/lib/queries';
import { fonts, radius, space } from '@/theme';

const c = themes.light.color;

/** Why a settled event verified nothing, in the mascot's words (NFR-U4). */
const ZERO_REASON: Record<ZeroPayoutReason, string> = {
  late_photo: 'A meter photo came in after its deadline.',
  missing_photo: 'A meter photo was missing, so we could not verify your cut.',
  failed_check: 'A meter reading did not pass the checks.',
  no_measured_cut: 'Your meter showed no drop below your usual usage.',
  missing_ami_data: 'Smart-meter data for the window was missing.',
};

/** Result card after settlement (FR-APP-15; mockup "Result"). A cut that was not verified always says why. */
export default function ResultScreen() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const result = useResult(alertId);

  if (result.isPending) return <Loading />;
  if (result.isError) return <ErrorState onRetry={() => void result.refetch()} />;

  const r = result.data;
  if (!r) {
    return (
      <Screen roomy onRefresh={result.refetch}>
        <MascotHeader
          label="Your result"
          line={`Results arrive ${SETTLEMENT_DELAY_MIN} minutes after the window ends.`}
        />
        <Text color="onSurfaceVariant">Pull down to check again.</Text>
      </Screen>
    );
  }

  const paid = r.zeroReason === null;
  // The same rule settlement applies to the stored score.
  const change = contributionDelta(paid, r.zeroReason);

  return (
    <Screen roomy onRefresh={result.refetch}>
      {paid ? (
        <MascotHeader
          label="Your result"
          line={`You saved ${formatKwh(r.verifiedKwh)}!`}
          pose="reward"
          tone="reward"
        />
      ) : (
        <MascotHeader label="Your result" line={ZERO_REASON[r.zeroReason!]} pose="missed" />
      )}

      <View style={styles.total}>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          Your Contribution Score
        </Text>
        <Text style={styles.figure}>{formatScoreChange(change)}</Text>
        {r.barangayTargetHit ? (
          <View style={styles.chip}>
            <Text variant="titleSmall" style={{ color: c.onBrandAccent }}>
              Your barangay reached its target
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.panel} accessibilityLabel="How it adds up">
        <Line label="You committed" value={formatKw(r.committedKw)} />
        <Line
          label="Verified cut"
          value={`${formatKw(r.paidCutKw)} · ${formatKwh(r.verifiedKwh)}`}
        />
        <Line
          label="Barangay target"
          value={r.barangayTargetHit ? 'Reached' : 'Not reached'}
          last
        />
      </View>

      <Text variant="bodySmall" color="onSurfaceVariant" align="center">
        Your score unlocks the perks on Home. The score steps and the perks are placeholders for the
        pilot, not yet agreed with Meralco.
      </Text>

      <View style={styles.bottom}>
        <Button label="Back to home" onPress={() => router.dismissAll()} />
      </View>
    </Screen>
  );
}

function Line(props: { label: string; value: string; note?: string; last?: boolean }) {
  return (
    <View style={[styles.line, !props.last && styles.divider]}>
      <View style={styles.flex}>
        <Text color="onSurfaceVariant">{props.label}</Text>
        {props.note ? (
          <Text variant="bodySmall" color="relief" style={styles.strong}>
            {props.note}
          </Text>
        ) : null}
      </View>
      <Text style={styles.tabular}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  strong: { fontFamily: fonts.semibold },
  tabular: { fontVariant: ['tabular-nums'] },
  total: { alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  figure: {
    fontFamily: fonts.semibold,
    fontSize: 56,
    lineHeight: 64,
    color: c.onSurface,
    fontVariant: ['tabular-nums'],
  },
  chip: {
    height: 32,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    backgroundColor: c.brandAccent,
    justifyContent: 'center',
  },
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    paddingHorizontal: space.lg,
    paddingVertical: space.xs,
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  divider: { borderBottomWidth: 1, borderBottomColor: c.outlineVariant },
  bottom: { marginTop: 'auto' },
});
