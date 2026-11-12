import { contributionStanding, type HouseholdMe } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { formatKwh } from '@/utils/format';
import { radius, space } from '@/styles/theme';
import { HEADER_MUTED } from '../utils/header-muted';
import { initials } from '../utils/initials';
import { Stat } from './Stat';

const c = themes.light.color;

/** The indigo header: initials, name and barangay, then score, level and energy saved. */
export function ProfileHeader(props: {
  household: HouseholdMe;
  savedKwh: number;
  topInset: number;
}) {
  const h = props.household;
  return (
    <View style={[styles.header, { paddingTop: props.topInset + space.xl }]}>
      <View style={styles.who}>
        <View style={styles.avatar}>
          <Text variant="titleLarge" style={{ color: c.brand }}>
            {initials(h.accountName)}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text variant="titleLarge" style={{ color: c.onPrimary }}>
            {h.accountName ?? 'Household'}
          </Text>
          <Text variant="bodyMedium" style={{ color: HEADER_MUTED }}>
            {`${h.barangayName}, ${h.municipality}`}
          </Text>
        </View>
      </View>
      <View style={styles.stats}>
        <Stat label="Score" value={String(Math.round(h.trustScore))} />
        <View style={styles.statDivider} />
        <Stat label="Level" value={contributionStanding(h.trustScore).band.name} />
        <View style={styles.statDivider} />
        <Stat label="Saved" value={formatKwh(props.savedKwh)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    backgroundColor: c.brand,
    paddingHorizontal: space.xl,
    paddingBottom: space.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: space.xl,
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: c.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: space.md,
  },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.2)' },
});
