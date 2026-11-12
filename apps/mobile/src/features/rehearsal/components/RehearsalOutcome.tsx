import { themes } from '@kapitwatt/styles';
import { StyleSheet, View } from 'react-native';
import { radius, space } from '@kapitwatt/tokens';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { Row } from '@/components/ui';
import { formatKw } from '@/utils/format';

const c = themes.light.color;

/** After both photos: the baseline and cap they set, or a note that a reading is under review. */
export function RehearsalOutcome(props: { baselineKw: number | null; commitCapKw: number | null }) {
  const baseline = props.baselineKw;
  return baseline !== null ? (
    <>
      <MascotHeader
        label="Practice complete"
        line="You're ready for your first alert!"
        pose="reward"
        tone="reward"
      />
      <View style={styles.panel}>
        <Row label="Your usual usage" value={formatKw(baseline)} strong />
        <Row label="Most you can commit" value={formatKw(props.commitCapKw ?? 0)} />
      </View>
    </>
  ) : (
    <MascotHeader
      label="Practice sent for review"
      line="A reading needs a check. You can commit once it is approved."
    />
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    padding: space[4],
    gap: space[2],
  },
});
