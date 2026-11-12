import { Icon } from '@kapitwatt/icons';
import { contributionStanding, TRUST } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { radius, space } from '@kapitwatt/tokens';
import { Text } from '@kapitwatt/ui';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { perkLines } from '@/utils/perks';
import { ink } from '../utils/ink';
import { LanternString } from './LanternString';
import { Perk } from './Perk';

const c = themes.light.color;

/**
 * "Your light": the Contribution Score (Kuryente Orange: rewards) as a light that grows, its levels
 * as lanterns from Kislap to Tala, what the next level needs, and the perks of the current one
 * behind a toggle. The perks are proposals, and the card says so.
 */
export function LightCard({ score }: { score: number }) {
  const [open, setOpen] = useState(false);
  const { band, next, toNext } = contributionStanding(score);
  const perks = perkLines(band);
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text variant="labelMedium" style={[styles.overline, { color: ink }]}>
          YOUR LIGHT
        </Text>
        <View style={styles.level}>
          <Text variant="titleSmall" style={{ color: c.onBrandAccent }}>
            {band.name}
          </Text>
        </View>
      </View>

      <View style={styles.figure}>
        <Text variant="headlineLarge" style={[styles.tabular, { color: ink }]}>
          {String(Math.round(score))}
        </Text>
        <Text variant="titleMedium" style={[styles.tabular, { color: ink }]}>
          {`/ ${TRUST.max} Contribution Score`}
        </Text>
      </View>

      <LanternString score={score} current={band.name} />

      <Text variant="bodyMedium" style={{ color: ink }}>
        {next
          ? `${toNext} more to reach ${next.name}. Each verified cut adds ${TRUST.cleanEvent}.`
          : 'You are at the top level.'}
      </Text>

      {perks.length > 0 ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            onPress={() => setOpen((v) => !v)}
            style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
          >
            <Text variant="titleSmall" style={[styles.flex, { color: ink }]}>
              {`Your ${band.name} perks (${perks.length})`}
            </Text>
            <Icon name={open ? 'chevronUp' : 'chevronDown'} size="sm" color={ink} />
          </Pressable>
          {open ? perks.map((line) => <Perk key={line} line={line} />) : null}
        </>
      ) : (
        <Text variant="bodyMedium" style={{ color: ink }}>
          {`Your perks are paused. They come back at ${next?.minScore ?? TRUST.start}; a verified cut in the next grid alert adds ${TRUST.cleanEvent}.`}
        </Text>
      )}

      <Text variant="bodySmall" style={{ color: ink }}>
        Proposed perks for the pilot. None is agreed with Meralco or a partner yet.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.85 },
  card: {
    borderRadius: radius.lg,
    backgroundColor: c.tertiaryContainer,
    padding: space[4],
    gap: space[3],
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overline: { letterSpacing: 0.5 },
  level: {
    height: 28,
    paddingHorizontal: space[3],
    borderRadius: radius.full,
    backgroundColor: c.brandAccent,
    justifyContent: 'center',
  },
  figure: { flexDirection: 'row', alignItems: 'baseline', gap: space[1] },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space[2], paddingVertical: space[1] },
});
