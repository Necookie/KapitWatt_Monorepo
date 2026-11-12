import { CONTRIBUTION_BANDS, TRUST } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { Lantern } from '@/components/night/Lantern';
import { ink } from '../utils/ink';

const c = themes.light.color;
/** The lit levels, from Kislap (spark) to Tala (star); Paused is not a light. */
const LEVELS = CONTRIBUTION_BANDS.filter((b) => b.minScore >= TRUST.start);
/** Each level's lantern is a little taller than the one before (px). */
const SIZES = [30, 36, 42, 48];
/** Room for the tallest lantern and its cord. */
const ROW = 58;
const CORD = 6;

/**
 * The Contribution Score levels as lanterns hanging from a wire, lit up to where the household is
 * (the wire too): the light grows from a spark to a star. The current level's lantern has a ring
 * around it. Flat
 * shapes only (DESIGN.md); the words under each lantern carry the meaning, not the colour.
 */
export function LanternString({ score, current }: { score: number; current: string }) {
  // The last level reached (levels are in order, so it is how many are reached, less one).
  const reachedIndex = LEVELS.filter((b) => score >= b.minScore).length - 1;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Levels: ${LEVELS.map((b) => `${b.name}${score >= b.minScore ? ', reached' : ''}`).join('; ')}`}
    >
      {LEVELS.map((b, i) => {
        const lit = score >= b.minScore;
        const size = SIZES[i] ?? SIZES[SIZES.length - 1]!;
        const isCurrent = b.name === current;
        return (
          <View key={b.name} style={styles.level}>
            {i > 0 ? (
              <View
                style={[
                  styles.string,
                  { backgroundColor: i <= reachedIndex ? c.brandAccent : withAlpha(ink, 0.25) },
                ]}
              />
            ) : null}
            <View style={styles.slot}>
              <View
                style={[
                  styles.cord,
                  { backgroundColor: lit ? c.brandAccent : withAlpha(ink, 0.25) },
                ]}
              />
              {isCurrent ? (
                <View
                  style={[
                    styles.ring,
                    {
                      // Centred on the lantern's body (half its height, under the cord).
                      top: CORD + size * 0.5 - size * 0.475,
                      width: size * 0.95,
                      height: size * 0.95,
                      borderRadius: size * 0.475,
                    },
                  ]}
                />
              ) : null}
              <View style={styles.front}>
                <Lantern height={size} state={lit ? 'lit' : 'unlit'} ink={ink} />
              </View>
            </View>
            <Text
              variant={isCurrent ? 'titleSmall' : 'labelMedium'}
              style={{ color: lit ? ink : withAlpha(ink, 0.55) }}
            >
              {b.name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  level: { flex: 1, alignItems: 'center', gap: 4 },
  slot: { height: ROW, alignItems: 'center' },
  cord: { width: 1.5, height: CORD },
  // Above its ring (on the web a positioned ring would otherwise paint over it).
  front: { zIndex: 1 },
  // The wire, from above the previous lantern to above this one.
  string: { position: 'absolute', top: 0, right: '50%', width: '100%', height: 2 },
  ring: { position: 'absolute', backgroundColor: withAlpha(c.brandAccent, 0.22) },
});
