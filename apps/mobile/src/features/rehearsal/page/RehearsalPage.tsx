import { PHOTO_RULES } from '@kapitwatt/shared';
import { Button, Text } from '@kapitwatt/ui';
import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { space } from '@kapitwatt/tokens';
import { MeterCapture } from '@/components/capture/MeterCapture';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { ErrorState, Loading, Screen } from '@/components/ui';
import { MOCK } from '@/api/config';
import { PhotoSteps } from '../components/PhotoSteps';
import { RehearsalOutcome } from '../components/RehearsalOutcome';
import { useRehearsal } from '../hooks/useRehearsal';

/**
 * Practice run for photo households (FR-APP-04; mockup "Practice run"): the same two photos as a
 * real event. It doubles as the tutorial and sets the baseline. The step comes from the server
 * (`rehearsalReadings`), so a restart resumes at the right photo.
 */
export default function RehearsalPage() {
  const rehearsal = useRehearsal();

  if (rehearsal.state === 'pending') return <Loading />;
  if (rehearsal.state === 'error') return <ErrorState onRetry={rehearsal.retry} />;
  const { household: h, nextPhoto } = rehearsal;

  if (rehearsal.smartMeter) {
    return (
      <Screen roomy>
        <MascotHeader label="Practice run" line="No practice needed with a smart meter." />
        <View style={styles.bottom}>
          <Button size="lg" fullWidth label="Go to home" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  if (rehearsal.capturing) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <MeterCapture
          key={nextPhoto}
          kind="rehearsal"
          title={`Practice photo ${nextPhoto} of 2`}
          onClose={rehearsal.closeCapture}
          onDone={rehearsal.onCaptured}
        />
      </>
    );
  }

  if (rehearsal.complete) {
    return (
      <Screen roomy>
        <RehearsalOutcome baselineKw={h.baselineKw} commitCapKw={h.commitCapKw} />
        <View style={styles.bottom}>
          <Button size="lg" fullWidth label="Go to home" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen roomy>
      <MascotHeader label="Practice run" line="Let's practise with two meter photos." />

      <PhotoSteps taken={rehearsal.taken} />

      <Text variant="bodyMedium" color="onSurfaceVariant">
        The two readings tell us your usual usage, so we can measure your cut during alerts.
      </Text>
      <Text variant="bodySmall" color="onSurfaceVariant">
        {`In a real alert the before photo is due ${PHOTO_RULES.beforeDeadlineMin} minutes after the window starts and the after photo ${PHOTO_RULES.afterDeadlineMin} minutes after it ends.`}
      </Text>

      <View style={styles.bottom}>
        <Button
          size="lg"
          fullWidth
          label={`Take photo ${nextPhoto}`}
          onPress={rehearsal.startCapture}
        />
        {/* Demo only: the baseline it sets lives in the mock household (MOCK.account). */}
        {MOCK.account ? (
          <Button
            variant="text"
            label="Skip practice (demo)"

            align="center"
            onPress={rehearsal.skipPractice}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bottom: { marginTop: 'auto', gap: space[1] },
});
