import type { AlertView, MeterReading } from '@kapitwatt/shared';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card } from '@/components/ui';
import { formatClock } from '@/lib/format';
import { useServerNow } from '@/lib/serverTime';
import { colors, space, text } from '@/theme';

type Kind = 'before' | 'after';

/**
 * The two meter photos and their fixed deadlines, always visible to a photo household (NFR-U3).
 * Capture is offered only inside its window and only once (FR-APP-13).
 */
export function PhotoSteps(props: { view: AlertView; readings: MeterReading[] }) {
  const now = useServerNow();
  const { view } = props;
  const steps: { kind: Kind; title: string; opensAt: string; dueAt: string }[] = [
    {
      kind: 'before',
      title: 'Before photo',
      opensAt: view.alert.windowStart,
      dueAt: view.beforePhotoDueAt,
    },
    {
      kind: 'after',
      title: 'After photo',
      opensAt: view.afterPhotoOpensAt,
      dueAt: view.afterPhotoDueAt,
    },
  ];

  return (
    <Card title="Meter photos">
      {steps.map((step) => {
        const reading = props.readings.find((r) => r.kind === step.kind);
        const open = now >= new Date(step.opensAt).getTime();
        const closed = now > new Date(step.dueAt).getTime();
        const status = reading
          ? reading.checkStatus === 'pass'
            ? 'Accepted'
            : 'Sent, flagged for review'
          : closed
            ? 'Missed. No payout for this event.'
            : open
              ? `Take it before ${formatClock(step.dueAt)}`
              : `Opens at ${formatClock(step.opensAt)}, due by ${formatClock(step.dueAt)}`;
        return (
          <View key={step.kind} style={styles.step}>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={[styles.status, reading?.checkStatus === 'pass' && styles.ok]}>
              {status}
            </Text>
            {!reading && open && !closed ? (
              <Button
                label={`Take ${step.title.toLowerCase()}`}
                onPress={() =>
                  router.push({
                    pathname: '/alert/[alertId]/capture',
                    params: { alertId: view.alert.id, kind: step.kind },
                  })
                }
              />
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  step: { gap: space.xs, paddingVertical: space.xs },
  title: { ...text.body, fontWeight: '700', color: colors.ink },
  status: { ...text.body, color: colors.muted },
  ok: { color: colors.green },
});
