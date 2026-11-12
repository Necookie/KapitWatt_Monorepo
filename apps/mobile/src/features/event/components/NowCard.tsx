import { Button, Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { space } from '@kapitwatt/tokens';
import { MascotHeader } from '@/components/mascot/MascotHeader';

import { formatKw } from '@/utils/format';
import type { EventMood } from '@/utils/event-mood';
import type { NowAction, NowCard as NowCardContent } from '@/utils/event-steps';

/** The mascot saying the one thing to do now, the live reduction when shown, and its action. */
export function NowCard(props: {
  card: NowCardContent;
  mood: EventMood;
  live: number | null;
  onAction: (kind: NowAction) => void;
}) {
  const { card, mood, live } = props;
  return (
    <View style={styles.now}>
      <MascotHeader label="Do this now" line={card.title} pose={mood.pose} tone={mood.tone} />
      <Text color="onSurfaceVariant">{card.body}</Text>
      {live !== null ? (
        <View>
          <Text variant="headlineMedium" color="relief" style={styles.tabular}>
            {formatKw(live)}
          </Text>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            below your usual usage right now
          </Text>
        </View>
      ) : null}
      {card.action ? (
        <Button
          size="lg"
          fullWidth
          label={card.action.label}
          onPress={() => card.action && props.onAction(card.action.kind)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  now: { gap: space[3] },
  tabular: { fontVariant: ['tabular-nums'] },
});
