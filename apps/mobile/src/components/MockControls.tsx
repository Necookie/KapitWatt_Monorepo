import { Button, Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { fontFamily, radius, space } from '@kapitwatt/tokens';
import { themes } from '@kapitwatt/styles';

import { MOCK } from '@/api/config';
import { mockFastForward, mockPhase, mockResetAll, mockSendAlert } from '@/api/mock';
import { useRefreshAll } from '@/api/queries';
import { useServerNow } from '@/utils/server-time';

const c = themes.light.color;

/** What the next press does, named after the real operator action it stands in for. */
const NEXT_STEP: Record<ReturnType<typeof mockPhase>, string> = {
  before_window: 'Start the peak window',
  window_open: 'Measure (fast-forward to window end)',
  settling: 'Settle results',
  settled: 'Start a new alert',
};

/**
 * Stand-ins for the operator's dashboard while the app runs on mock data. Kept in one clearly
 * separate box so they never look like part of the household app. Hidden once MOCK.events is off.
 */
export function MockControls() {
  const refreshAll = useRefreshAll();
  useServerNow(); // re-render every second so the label follows the mock clock
  if (!MOCK.events) return null;

  const run = (fn: () => void) => {
    fn();
    void refreshAll();
  };

  return (
    <View style={styles.box}>
      <Text variant="bodyMedium" style={styles.heading}>
        OPERATOR CONTROLS (DEMO)
      </Text>
      <Text variant="bodyMedium" style={styles.body}>
        These stand in for the Meralco dashboard. The real app does not have them.
      </Text>
      <Button
        variant="tonal"
        size="lg"
        fullWidth
        label={NEXT_STEP[mockPhase()]}
        onPress={() => run(mockFastForward)}
      />
      <Button
        variant="tonal"
        size="lg"
        fullWidth
        label="Send a new red alert"
        onPress={() => run(mockSendAlert)}
      />
      <Button
        variant="outlined"
        size="lg"
        fullWidth
        label="Reset demo"

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
    borderColor: c.simulated,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[2],
    marginTop: space[4],
  },
  heading: {
    fontFamily: fontFamily.semibold,
    color: c.simulated,
    letterSpacing: 1,
  },
  body: { color: c.onSurfaceVariant },
});
