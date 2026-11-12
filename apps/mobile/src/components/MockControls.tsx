import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { USE_MOCKS } from '@/lib/config';
import { mockFastForward, mockPhase, mockResetAll, mockSendAlert } from '@/lib/mock';
import { useRefreshAll } from '@/lib/queries';
import { useServerNow } from '@/lib/serverTime';
import { colors, radius, space, text } from '@/theme';

/** What the next press does, named after the real operator action it stands in for. */
const NEXT_STEP: Record<ReturnType<typeof mockPhase>, string> = {
  before_window: 'Start the peak window',
  window_open: 'Measure (fast-forward to window end)',
  settling: 'Settle results',
  settled: 'Start a new alert',
};

/**
 * Stand-ins for the operator's dashboard while the app runs on mock data. Kept in one clearly
 * separate box so they never look like part of the household app. Hidden once USE_MOCKS is off.
 */
export function MockControls() {
  const refreshAll = useRefreshAll();
  useServerNow(); // re-render every second so the label follows the mock clock
  if (!USE_MOCKS) return null;

  const run = (fn: () => void) => {
    fn();
    void refreshAll();
  };

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>OPERATOR CONTROLS (DEMO)</Text>
      <Text style={styles.body}>
        These stand in for the Meralco dashboard. The real app does not have them.
      </Text>
      <Button label={NEXT_STEP[mockPhase()]} variant="demo" onPress={() => run(mockFastForward)} />
      <Button label="Send a new red alert" variant="demo" onPress={() => run(mockSendAlert)} />
      <Button
        label="Reset demo"
        variant="secondary"
        onPress={() => {
          run(mockResetAll);
          router.replace('/');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.amber,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
    marginTop: space.lg,
  },
  heading: { ...text.caption, fontWeight: '700', color: colors.amber, letterSpacing: 1 },
  body: { ...text.caption, color: colors.muted },
});
