import { themes } from '@kapitwatt/styles';
import { COMMIT_PRESETS_KW, DEFAULT_WINDOW_HOURS, TRUST } from '@kapitwatt/shared';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

const c = themes.light.color;

/** The example: 1 kW less for the default window, verified. */
const EXAMPLE_KW = COMMIT_PRESETS_KW[1];
/** What one verified cut adds to the Contribution Score. */
const EXAMPLE_SCORE = TRUST.cleanEvent;
const COUNT_MS = 700;

/** What the cut just tried would earn: pops in, then the score it adds counts up. */
export function RewardChip() {
  const pop = useRef(new Animated.Value(0)).current;
  const [share, setShare] = useState(0);
  useEffect(() => {
    Animated.timing(pop, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min((Date.now() - t0) / COUNT_MS, 1);
      setShare(1 - (1 - p) ** 3);
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [pop]);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.chip,
          {
            opacity: pop,
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
          },
        ]}
        accessibilityLabel={`Plus ${EXAMPLE_SCORE} to your Contribution Score`}
      >
        <Text variant="titleMedium" style={{ color: c.onTertiaryContainer }}>
          +{Math.round(EXAMPLE_SCORE * share)} Contribution Score
        </Text>
      </Animated.View>
      <Text variant="bodySmall" align="center" style={styles.note}>
        {`${EXAMPLE_KW} kW less for ${DEFAULT_WINDOW_HOURS} hours, once it is verified.\nPlaceholder perks.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: c.tertiaryContainer,
  },
  note: { color: withAlpha(c.onBrand, 0.72) },
});
