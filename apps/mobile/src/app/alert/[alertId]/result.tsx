import { REWARD, SETTLEMENT_DELAY_MIN, type ZeroPayoutReason } from '@kapitwatt/shared';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Card, ErrorState, Loading, Row, Screen, SimulatedNote } from '@/components/ui';
import { formatKw, formatKwh, formatPhp } from '@/lib/format';
import { useResult } from '@/lib/queries';
import { colors, text } from '@/theme';

const ZERO_REASON: Record<ZeroPayoutReason, string> = {
  late_photo: 'A meter photo arrived after its deadline.',
  missing_photo: 'A meter photo was not taken, so the cut could not be verified.',
  failed_check: 'A meter reading did not pass the checks.',
  no_measured_cut: 'Your meter showed no drop below your usual usage.',
  missing_ami_data: 'Smart-meter data for the window was missing.',
};

/** Result card after settlement (FR-APP-15). A zero payout always says why (NFR-U4). */
export default function ResultScreen() {
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const result = useResult(alertId);

  if (result.isPending) return <Loading />;
  if (result.isError) return <ErrorState onRetry={() => void result.refetch()} />;

  const r = result.data;
  if (!r) {
    return (
      <Screen onRefresh={result.refetch} refreshing={result.isRefetching}>
        <Card title="Results are not in yet">
          <Text style={styles.body}>
            {`They arrive ${SETTLEMENT_DELAY_MIN} minutes after the window ends. Pull to refresh.`}
          </Text>
        </Card>
      </Screen>
    );
  }

  const total = r.creditPhp + r.bonusPhp;

  return (
    <Screen onRefresh={result.refetch} refreshing={result.isRefetching}>
      <Card>
        <Text style={styles.label}>You earned</Text>
        <Text style={styles.figure}>{formatPhp(total)}</Text>
        <Text style={styles.points}>+{r.points} points</Text>
        {r.zeroReason ? <Text style={styles.reason}>{ZERO_REASON[r.zeroReason]}</Text> : null}
      </Card>

      <Card title="How it adds up">
        <Row label="Committed" value={formatKw(r.committedKw)} />
        <Row label="Verified cut" value={formatKw(r.paidCutKw)} />
        <Row label="Verified energy saved" value={formatKwh(r.verifiedKwh)} strong />
        <Row label="Bill credit" value={formatPhp(r.creditPhp)} />
        <Row
          label={r.barangayTargetHit ? 'Barangay bonus (target reached)' : 'Barangay bonus'}
          value={formatPhp(r.bonusPhp)}
        />
      </Card>

      <SimulatedNote>
        {`Placeholder rate of PHP ${REWARD.ratePhpPerKwh.toFixed(2)} per verified kWh, ${REWARD.pathMultiplier.photo}x for photo readings. The real rate would be set by Meralco and the ERC.`}
      </SimulatedNote>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...text.body, color: colors.muted },
  figure: { ...text.figure, color: colors.green },
  points: { ...text.title, color: colors.teal },
  reason: { ...text.body, color: colors.red },
  body: { ...text.body, color: colors.muted },
});
