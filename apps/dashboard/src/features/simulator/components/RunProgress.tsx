import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { Tally } from '@/components/Tally';
import { kw } from '@/utils/format';
import { barScale, motion } from '@/styles/motion';

const round = (n: number) => kw(Math.round(n));

/**
 * The paced commit run as it happens: committed kW counting up toward what the run is expected to
 * commit, with a bar that glides with each poll.
 */
export function RunProgress({
  committedKw,
  expectedKw,
}: {
  committedKw: number;
  expectedKw: number;
}) {
  const t = useTheme();
  const share = expectedKw > 0 ? Math.min(committedKw / expectedKw, 1) : 0;
  return (
    <View style={[{ gap: t.space[2] }, motion.dropIn]}>
      <Text variant="bodySmall" color="onSurfaceVariant" style={{ fontVariant: ['tabular-nums'] }}>
        Committing: <Tally value={committedKw} format={round} /> of about {round(expectedKw)} kW
      </Text>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`${Math.round(share * 100)}% of the expected commitments in`}
        style={{
          height: 6,
          borderRadius: t.radius.full,
          overflow: 'hidden',
          backgroundColor: t.color.surfaceContainerHighest,
        }}
      >
        <View
          style={[
            barScale(share),
            { height: 6, borderRadius: t.radius.full, backgroundColor: t.dataViz.committed },
          ]}
        />
      </View>
    </View>
  );
}
