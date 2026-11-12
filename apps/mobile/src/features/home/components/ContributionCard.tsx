import { Icon } from '@kapitwatt/icons';
import { CONTRIBUTION_BANDS, contributionStanding, TRUST } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProgressBar } from '@/components/ui';
import { perkLines } from '@/utils/perks';
import { radius, space } from '@/styles/theme';
import { ink } from '../utils/ink';
import { Perk } from './Perk';

const c = themes.light.color;

/**
 * The household's Contribution Score and the perks it unlocks (Kuryente Orange: rewards). The perks
 * live here, on Home: the current band's in full, and every band behind "See all levels".
 */
export function ContributionCard(props: { score: number }) {
  const [open, setOpen] = useState(false);
  const score = Math.round(props.score);
  const { band, next, toNext } = contributionStanding(props.score);
  const perks = perkLines(band);
  return (
    <View style={styles.score}>
      <View style={styles.scoreHead}>
        <View style={styles.flex}>
          <Text variant="bodyMedium" style={{ color: ink }}>
            Contribution Score
          </Text>
          <View style={styles.scoreFigure}>
            <Text variant="headlineLarge" style={[styles.tabular, { color: ink }]}>
              {String(score)}
            </Text>
            <Text variant="titleMedium" style={[styles.tabular, { color: ink }]}>
              {`/ ${TRUST.max}`}
            </Text>
          </View>
        </View>
        <View style={styles.level}>
          <Text variant="titleSmall" style={{ color: c.onBrandAccent }}>
            {band.name}
          </Text>
        </View>
      </View>

      <ProgressBar
        value={props.score / TRUST.max}
        tone="primary"
        accessibilityLabel={`Contribution Score ${score} out of ${TRUST.max}`}
      />
      <Text variant="bodyMedium" style={{ color: ink }}>
        {next
          ? `${toNext} more to reach ${next.name}. Each verified cut adds ${TRUST.cleanEvent}.`
          : 'You are at the top level.'}
      </Text>

      <View style={styles.perks}>
        <Text variant="titleSmall" style={{ color: ink }}>
          {perks.length > 0 ? 'Your perks' : 'Your perks are paused'}
        </Text>
        {perks.length > 0 ? (
          perks.map((line) => <Perk key={line} line={line} />)
        ) : (
          <Text variant="bodyMedium" style={{ color: ink }}>
            {`They come back at ${next?.minScore ?? TRUST.start}. A verified cut in the next grid alert adds ${TRUST.cleanEvent}.`}
          </Text>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      >
        <Text variant="titleSmall" style={{ color: ink }}>
          {open ? 'Hide levels' : 'See all levels'}
        </Text>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size="sm" color={ink} />
      </Pressable>

      {open
        ? CONTRIBUTION_BANDS.filter((b) => b.minScore >= TRUST.start).map((b) => {
            const reached = props.score >= b.minScore;
            return (
              <View key={b.name} style={styles.band}>
                <View style={styles.bandHead}>
                  <Icon name={reached ? 'check' : 'locked'} size="sm" color={ink} />
                  <Text variant="titleSmall" style={[styles.flex, { color: ink }]}>
                    {b.name}
                  </Text>
                  <Text variant="bodySmall" style={[styles.tabular, { color: ink }]}>
                    {`from ${b.minScore}`}
                  </Text>
                </View>
                {perkLines(b).map((line) => (
                  <Text key={line} variant="bodySmall" style={{ color: ink }}>
                    {line}
                  </Text>
                ))}
              </View>
            );
          })
        : null}

      <Text variant="bodySmall" style={{ color: ink }}>
        Proposed perks for the pilot. None is agreed with Meralco or a partner yet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  tabular: { fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.85 },
  score: {
    borderRadius: radius.lg,
    backgroundColor: c.tertiaryContainer,
    padding: space.lg,
    gap: space.md,
  },
  scoreHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  scoreFigure: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  level: {
    height: 32,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    backgroundColor: c.brandAccent,
    justifyContent: 'center',
  },
  perks: { gap: space.sm },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 44 },
  band: { gap: 2, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: c.outlineVariant },
  bandHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
