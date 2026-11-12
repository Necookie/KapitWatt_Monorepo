import { PHOTO_RULES, REHEARSAL_MIN_MINUTES } from '@kapitwatt/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { MeterCapture } from '@/components/capture/MeterCapture';
import { Button, Card, ErrorState, Loading, Row, Screen, SimulatedNote } from '@/components/ui';
import { formatKw } from '@/lib/format';
import { useMe } from '@/lib/queries';
import { colors, text } from '@/theme';

/**
 * Practice run for photo households (FR-APP-04): the same two photos as a real event. It doubles
 * as the tutorial and sets the baseline. Progress comes from the server (`rehearsalReadings`), so
 * closing the app between the two photos, which must be taken some time apart, resumes at the
 * right one.
 */
export default function RehearsalScreen() {
  const me = useMe();
  const [capturing, setCapturing] = useState(false);

  if (me.isPending) return <Loading />;
  if (me.isError) return <ErrorState onRetry={() => void me.refetch()} />;

  if (me.data.meterType === 'ami') {
    return (
      <Screen>
        <Card title="No practice needed">
          <Text style={styles.body}>Smart-meter households do not take photos.</Text>
          <Button label="Go to home" onPress={() => router.replace('/')} />
        </Card>
      </Screen>
    );
  }

  const taken = me.data.rehearsalReadings;
  const baseline = me.data.baselineKw;

  if (capturing && taken < 2) {
    return (
      <Screen>
        <MeterCapture
          key={taken}
          kind="rehearsal"
          title={taken === 0 ? 'Practice photo 1 of 2' : 'Practice photo 2 of 2'}
          onDone={() => {
            setCapturing(false);
            void me.refetch();
          }}
        />
        <Button label="Not now" variant="secondary" onPress={() => setCapturing(false)} />
      </Screen>
    );
  }

  if (baseline !== null || taken >= 2) {
    return (
      <Screen onRefresh={me.refetch}>
        <Card title={baseline !== null ? 'Practice complete' : 'Practice sent for review'}>
          {baseline !== null ? (
            <>
              <Row label="Your usual usage" value={formatKw(baseline)} strong />
              <Row label="Most you can commit" value={formatKw(me.data.commitCapKw ?? 0)} />
            </>
          ) : (
            <Text style={styles.body}>
              A reading needs a check before we can set your usual usage. You can commit once it is
              approved.
            </Text>
          )}
          <Button label="Go to home" onPress={() => router.replace('/')} />
        </Card>
      </Screen>
    );
  }

  if (taken === 1) {
    return (
      <Screen onRefresh={me.refetch}>
        <Card title="Photo 1 received">
          <Text style={styles.body}>
            {`Use your appliances as usual, then take the second photo at least ${REHEARSAL_MIN_MINUTES} minutes after the first. The two readings measure your usual usage.`}
          </Text>
          <Button label="Take photo 2" onPress={() => setCapturing(true)} />
          <Button label="Go to home" variant="secondary" onPress={() => router.replace('/')} />
        </Card>
        <SimulatedNote>
          You can close the app in between. If it is too early, the app tells you how long to wait.
        </SimulatedNote>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card title="Practice with two photos">
        <Text style={styles.body}>
          During a grid alert you take two meter photos: one when the peak window starts and one
          when it ends. Let's practise now.
        </Text>
        <Text style={styles.body}>
          {`These two readings also measure your usual usage, which is how we know how much you cut later. Take them at least ${REHEARSAL_MIN_MINUTES} minutes apart.`}
        </Text>
        <Button label="Start" onPress={() => setCapturing(true)} />
        <Button label="Later" variant="secondary" onPress={() => router.replace('/')} />
      </Card>
      <SimulatedNote>
        {`Pilot rule: in a real event the before photo is due ${PHOTO_RULES.beforeDeadlineMin} minutes after the window starts and the after photo ${PHOTO_RULES.afterDeadlineMin} minutes after it ends.`}
      </SimulatedNote>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...text.body, color: colors.muted },
});
