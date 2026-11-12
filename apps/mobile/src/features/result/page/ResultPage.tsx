import { SETTLEMENT_DELAY_MIN } from '@kapitwatt/shared';
import { Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { Button, ErrorState, Loading, Screen } from '@/components/ui';
import { ResultBreakdown } from '../components/ResultBreakdown';
import { ResultHeader } from '../components/ResultHeader';
import { ScoreTotal } from '../components/ScoreTotal';
import { useResultCard } from '../hooks/useResultCard';

/** Result card after settlement (FR-APP-15; mockup "Result"). A cut that was not verified always says why. */
export default function ResultPage() {
  const card = useResultCard();

  if (card.state === 'pending') return <Loading />;
  if (card.state === 'error') return <ErrorState onRetry={() => void card.refetch()} />;

  if (card.state === 'unsettled') {
    return (
      <Screen roomy onRefresh={card.refetch}>
        <MascotHeader
          label="Your result"
          line={`Results arrive ${SETTLEMENT_DELAY_MIN} minutes after the window ends.`}
        />
        <Text color="onSurfaceVariant">Pull down to check again.</Text>
      </Screen>
    );
  }

  const { result: r, change } = card;

  return (
    <Screen roomy onRefresh={card.refetch}>
      <ResultHeader zeroReason={r.zeroReason} verifiedKwh={r.verifiedKwh} />

      <ScoreTotal change={change} barangayTargetHit={r.barangayTargetHit} />

      <ResultBreakdown result={r} />

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

const styles = StyleSheet.create({
  bottom: { marginTop: 'auto' },
});
