import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import type { NowCard as NowCardData } from '@/lib/eventSteps';
import { formatKw } from '@/lib/format';
import { colors, fonts, radius, space, text } from '@/theme';

/** The single "do this now" card at the top of the event screen. */
export function NowCard(props: {
  card: NowCardData;
  onAction: () => void;
  liveReductionKw: number | null;
  committedKw: number | null;
}) {
  const { card } = props;
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>DO THIS NOW</Text>
      <Text style={styles.title}>{card.title}</Text>
      <Text style={styles.body}>{card.body}</Text>
      {card.showLiveReduction && props.liveReductionKw !== null ? (
        <View>
          <Text style={styles.figure}>{formatKw(props.liveReductionKw)}</Text>
          <Text style={styles.body}>
            below your usual usage right now
            {props.committedKw !== null ? ` (you committed ${formatKw(props.committedKw)})` : ''}
          </Text>
        </View>
      ) : null}
      {card.action ? <Button label={card.action.label} onPress={props.onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: colors.teal,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
    backgroundColor: colors.background,
  },
  eyebrow: { ...text.caption, fontFamily: fonts.semibold, color: colors.teal, letterSpacing: 1 },
  title: { ...text.headline, color: colors.ink },
  body: { ...text.body, color: colors.muted },
  figure: { ...text.figure, color: colors.teal },
});
