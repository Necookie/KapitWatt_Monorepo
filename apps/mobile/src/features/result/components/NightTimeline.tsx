import { Icon } from '@kapitwatt/icons';
import { themes } from '@kapitwatt/styles';
import { radius, space } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import type { ReceiptStep } from '../utils/receipt-steps';

const c = themes.light.color;
const ICON = { ok: 'check', flagged: 'flagged', failed: 'close' } as const;
const COLOR = { ok: 'relief', flagged: 'onSurfaceVariant', failed: 'error' } as const;

/**
 * "Your night": what the household did and what the checks found, step by step, each with its
 * own icon (a tick, a flag, a cross) so the state is never colour alone.
 */
export function NightTimeline({ steps }: { steps: ReceiptStep[] }) {
  return (
    <View style={styles.panel}>
      <Text variant="labelMedium" color="onSurfaceVariant" style={styles.overline}>
        YOUR NIGHT
      </Text>
      {steps.map((s) => (
        <View key={s.key} style={styles.step}>
          <Icon name={ICON[s.state]} size="sm" weight="bold" color={COLOR[s.state]} />
          <View style={styles.words}>
            <Text variant="titleSmall" color={s.state === 'failed' ? 'error' : 'onSurface'}>
              {s.title}
            </Text>
            {s.detail ? (
              <Text variant="bodySmall" color="onSurfaceVariant" style={styles.tabular}>
                {s.detail}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  panel: {
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
    padding: space[4],
    gap: space[3],
  },
  overline: { letterSpacing: 0.5 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  words: { flex: 1, gap: 2 },
});
