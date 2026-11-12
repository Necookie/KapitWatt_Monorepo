import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import type { Step, StepState } from '@/lib/eventSteps';
import { colors, radius, space, text } from '@/theme';

const MARK: Record<StepState, { symbol: string; color: string; note?: string }> = {
  done: { symbol: '✓', color: colors.green, note: 'Done' },
  now: { symbol: '●', color: colors.teal, note: 'Now' },
  later: { symbol: '○', color: colors.muted },
  missed: { symbol: '✕', color: colors.red, note: 'Missed' },
};

/** Checklist of the event's steps with done / now / later / missed. */
export function StepList(props: { steps: Step[] }) {
  return (
    <Card title="Your steps">
      {props.steps.map((step, i) => {
        const mark = MARK[step.state];
        return (
          <View key={step.key} style={[styles.row, step.state === 'now' && styles.rowNow]}>
            <Text style={[styles.symbol, { color: mark.color }]}>{mark.symbol}</Text>
            <View style={styles.main}>
              <Text style={[styles.title, step.state === 'later' && styles.muted]}>
                {i + 1}. {step.title}
              </Text>
              {step.when ? <Text style={styles.when}>{step.when}</Text> : null}
            </View>
            {mark.note ? (
              <Text style={[styles.note, { color: mark.color }]}>{mark.note}</Text>
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
  },
  rowNow: { backgroundColor: colors.background },
  symbol: { ...text.title, width: 24, textAlign: 'center' },
  main: { flex: 1 },
  title: { ...text.body, fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted, fontWeight: '400' },
  when: { ...text.caption, color: colors.muted },
  note: { ...text.caption, fontWeight: '700' },
});
