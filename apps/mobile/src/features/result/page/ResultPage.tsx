import { SETTLEMENT_DELAY_MIN } from '@kapitwatt/shared';
import { Button, Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { ErrorState, Loading, Screen } from '@/components/ui';
import { LightGained } from '../components/LightGained';
import { NightTimeline } from '../components/NightTimeline';
import { ReceiptHeader } from '../components/ReceiptHeader';
import { ReceiptMath } from '../components/ReceiptMath';
import { useResultCard } from '../hooks/useResultCard';

/**
 * A night's receipt, after settlement (FR-APP-15): Alitaptap and the result, the household's night
 * step by step with the photos' times and checks, how the verified kWh adds up, and the score it
 * added. A cut that was not verified always says why. Opened from History or after an event;
 * "Done" goes back to where it was opened from.
 */
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

  return (
    <Screen roomy onRefresh={card.refetch}>
      <ReceiptHeader
        view={card.view}
        zeroReason={card.result.zeroReason}
        verifiedKwh={card.result.verifiedKwh}
      />
      <NightTimeline steps={card.steps} />
      <ReceiptMath result={card.result} commitment={card.commitment} hours={card.hours} />
      <LightGained change={card.change} score={card.score} />

      <Text variant="bodySmall" color="onSurfaceVariant" align="center">
        Your score unlocks the perks on Home. The score steps and the perks are placeholders for the
        pilot, not yet agreed with Meralco.
      </Text>

      <View style={styles.bottom}>
        <Button size="lg" fullWidth label="Done" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bottom: { marginTop: 'auto' },
});
