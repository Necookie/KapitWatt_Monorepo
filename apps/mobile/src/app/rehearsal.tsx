import { PHOTO_RULES } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MeterCapture } from '@/components/capture/MeterCapture';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { Button, ErrorState, Loading, Row, Screen } from '@/components/ui';
import { MOCK } from '@/lib/config';
import { formatKw } from '@/lib/format';
import { mockSkipRehearsal } from '@/lib/mock';
import { useMe, useRefreshAll } from '@/lib/queries';
import { radius, space } from '@/theme';

const c = themes.light.color;

/**
 * Practice run for photo households (FR-APP-04; mockup "Practice run"): the same two photos as a
 * real event. It doubles as the tutorial and sets the baseline. The step comes from the server
 * (`rehearsalReadings`), so a restart resumes at the right photo.
 */
export default function RehearsalScreen() {
  const me = useMe();
  const refreshAll = useRefreshAll();
  const [capturing, setCapturing] = useState(false);
  const [finished, setFinished] = useState(false);

  if (me.isPending) return <Loading />;
  if (me.isError) return <ErrorState onRetry={() => void me.refetch()} />;
  const h = me.data;

  if (h.meterType === 'ami') {
    return (
      <Screen roomy>
        <MascotHeader label="Practice run" line="No practice needed with a smart meter." />
        <View style={styles.bottom}>
          <Button label="Go to home" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  const taken = Math.min(2, h.rehearsalReadings);
  const nextPhoto = taken === 0 ? 1 : 2;

  if (capturing) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <MeterCapture
          key={nextPhoto}
          kind="rehearsal"
          title={`Practice photo ${nextPhoto} of 2`}
          onClose={() => setCapturing(false)}
          onDone={() => {
            setCapturing(false);
            if (nextPhoto === 2) setFinished(true);
            void me.refetch();
          }}
        />
      </>
    );
  }

  if (finished || taken >= 2) {
    const baseline = h.baselineKw;
    return (
      <Screen roomy>
        {baseline !== null ? (
          <>
            <MascotHeader
              label="Practice complete"
              line="You're ready for your first alert!"
              pose="reward"
              tone="reward"
            />
            <View style={styles.panel}>
              <Row label="Your usual usage" value={formatKw(baseline)} strong />
              <Row label="Most you can commit" value={formatKw(h.commitCapKw ?? 0)} />
            </View>
          </>
        ) : (
          <MascotHeader
            label="Practice sent for review"
            line="A reading needs a check. You can commit once it is approved."
          />
        )}
        <View style={styles.bottom}>
          <Button label="Go to home" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen roomy>
      <MascotHeader label="Practice run" line="Let's practise with two meter photos." />

      <View style={styles.steps}>
        <PhotoStep
          number={1}
          title="First photo"
          detail={taken >= 1 ? 'Done' : 'Now'}
          state={taken >= 1 ? 'done' : 'now'}
        />
        <PhotoStep
          number={2}
          title="Second photo"
          detail={taken >= 1 ? 'Now' : 'Later, once some time has passed'}
          state={taken >= 1 ? 'now' : 'later'}
        />
      </View>

      <Text variant="bodyMedium" color="onSurfaceVariant">
        The two readings tell us your usual usage, so we can measure your cut during alerts.
      </Text>
      <Text variant="bodySmall" color="onSurfaceVariant">
        {`In a real alert the before photo is due ${PHOTO_RULES.beforeDeadlineMin} minutes after the window starts and the after photo ${PHOTO_RULES.afterDeadlineMin} minutes after it ends.`}
      </Text>

      <View style={styles.bottom}>
        <Button label={`Take photo ${nextPhoto}`} onPress={() => setCapturing(true)} />
        {/* Demo only: the baseline it sets lives in the mock household (MOCK.account). */}
        {MOCK.account ? (
          <Button
            label="Skip practice (demo)"
            variant="text"
            align="center"
            onPress={() => {
              mockSkipRehearsal();
              void refreshAll();
              router.replace('/');
            }}
          />
        ) : null}
      </View>
    </Screen>
  );
}

function PhotoStep(props: {
  number: number;
  title: string;
  detail: string;
  state: 'done' | 'now' | 'later';
}) {
  const now = props.state === 'now';
  const done = props.state === 'done';
  return (
    <View style={[styles.step, now ? styles.stepNow : styles.stepIdle]}>
      <View
        style={[
          styles.badge,
          { backgroundColor: done ? c.relief : now ? c.primary : c.surfaceContainerHighest },
        ]}
      >
        <Text
          variant="titleMedium"
          style={{ color: done ? c.onRelief : now ? c.onPrimary : c.onSurfaceVariant }}
        >
          {String(props.number)}
        </Text>
      </View>
      <View style={styles.flex}>
        <Text
          variant="titleMedium"
          color={props.state === 'later' ? 'onSurfaceVariant' : 'onSurface'}
        >
          {props.title}
        </Text>
        <Text variant="bodyMedium" color={done ? 'relief' : 'onSurfaceVariant'}>
          {props.detail}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  steps: { gap: space.md },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: space.lg,
    borderRadius: radius.lg,
  },
  stepNow: { borderWidth: 2, borderColor: c.primary, backgroundColor: c.surfaceContainerLowest },
  stepIdle: {
    borderWidth: 1,
    borderColor: c.outlineVariant,
    backgroundColor: c.surfaceContainerLow,
    margin: 1,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    padding: space.lg,
    gap: space.sm,
  },
  bottom: { marginTop: 'auto', gap: space.xs },
});
