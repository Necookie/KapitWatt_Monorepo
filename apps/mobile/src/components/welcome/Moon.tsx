import { themes } from '@kapitwatt/styles';
import { withAlpha } from '@kapitwatt/tokens';
import type { MascotPose } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { LivingMascot } from '@/components/mascot/LivingMascot';

const c = themes.light.color;

/** The moon's diameter; its soft ring of light adds HALO on every side. */
export const MOON_SIZE = 172;
const HALO = 14;
/** The moon with its ring of light, edge to edge. */
export const MOON_OUTER = MOON_SIZE + HALO * 2;

/**
 * Alitaptap in front of a pale moon. The mascot is Grid Indigo and would vanish into the night sky,
 * so it stands on a light disc, whole (burst marks and lantern glow included), with a soft ring of
 * light around the moon. `halo={false}` leaves the ring off where something else circles the moon.
 * The mascot is alive (LivingMascot): tap it on a story panel; on the try-it panel it trembles while
 * held.
 */
export function MoonMascot({
  pose,
  halo = true,
  pokeable = true,
  ...mood
}: {
  pose: MascotPose;
  halo?: boolean;
  pokeable?: boolean;
  excited?: boolean;
  eyesShut?: boolean;
  cheer?: number;
  wince?: number;
  onPoke?: () => void;
}) {
  return (
    <View style={[styles.outer, halo && styles.halo]}>
      <View style={styles.moon}>
        <LivingMascot pose={pose} height={MOON_SIZE * 0.86} pokeable={pokeable} {...mood} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: MOON_OUTER,
    height: MOON_OUTER,
    borderRadius: MOON_OUTER / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: { backgroundColor: withAlpha(c.primaryContainer, 0.12) },
  moon: {
    width: MOON_SIZE,
    height: MOON_SIZE,
    borderRadius: MOON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    // Paler than the lavender wings (primaryContainer), so they show against the moon.
    backgroundColor: c.surfaceContainerLow,
  },
});
