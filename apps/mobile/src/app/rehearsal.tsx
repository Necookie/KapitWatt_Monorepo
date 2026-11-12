import { PHOTO_RULES } from '@kapitwatt/shared';
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
 * as the tutorial and sets the baseline. The step is kept on the phone for now; once the API exists
 * it should come from the server so a restart resumes at the right step.
 */
export default function RehearsalScreen() {
  const me = useMe();
  const [step, setStep] = useState<'intro' | 'first' | 'second' | 'done'>('intro');

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

  if (step === 'intro') {
    return (
      <Screen>
        <Card title="Practice with two photos">
          <Text style={styles.body}>
            During a grid alert you take two meter photos: one when the peak window starts and one
            when it ends. Let's practise now.
          </Text>
          <Text style={styles.body}>
            These two readings also measure your usual usage, which is how we know how much you cut
            later.
          </Text>
          <Button label="Start" onPress={() => setStep('first')} />
        </Card>
        <SimulatedNote>
          {`Pilot rule: in a real event the before photo is due ${PHOTO_RULES.beforeDeadlineMin} minutes after the window starts and the after photo ${PHOTO_RULES.afterDeadlineMin} minutes after it ends.`}
        </SimulatedNote>
      </Screen>
    );
  }

  if (step === 'first' || step === 'second') {
    return (
      <Screen>
        <MeterCapture
          key={step}
          kind="rehearsal"
          title={step === 'first' ? 'Practice photo 1 of 2' : 'Practice photo 2 of 2'}
          onDone={() => {
            if (step === 'first') setStep('second');
            else {
              setStep('done');
              void me.refetch();
            }
          }}
        />
      </Screen>
    );
  }

  const baseline = me.data.baselineKw;
  return (
    <Screen>
      <Card title={baseline !== null ? 'Practice complete' : 'Practice sent for review'}>
        {baseline !== null ? (
          <>
            <Row label="Your usual usage" value={formatKw(baseline)} strong />
            <Row label="Most you can commit" value={formatKw(me.data.commitCapKw)} />
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

const styles = StyleSheet.create({
  body: { ...text.body, color: colors.muted },
});
