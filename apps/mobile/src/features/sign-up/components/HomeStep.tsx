import { Icon } from '@kapitwatt/icons';
import { PILOT_TOWNS, type Barangay } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LocationPrompt } from '@/components/LocationPrompt';
import { Button, Select } from '@/components/ui';
import { currentPosition, LocationError, type LocationProblem } from '@/utils/location';
import { radius, space } from '@/styles/theme';
import type { StepProps } from '../utils/draft';

const c = themes.light.color;

export function HomeStep({ draft, set, barangays }: StepProps & { barangays: Barangay[] }) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [problem, setProblem] = useState<LocationProblem | null>(null);
  const townBarangays = barangays.filter((b) => b.municipality === draft.town);

  const locate = async () => {
    setLocationError(null);
    setLocating(true);
    try {
      set({ location: await currentPosition() });
      setProblem(null);
    } catch (e) {
      if (e instanceof LocationError) setProblem(e.problem);
      else setLocationError('Could not get your location. Try again outside or near a window.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.fields}>
      <Select
        label="Town"
        placeholder="Choose your town"
        options={PILOT_TOWNS.map((t) => ({ value: t, label: t }))}
        value={draft.town}
        onChange={(town) => set({ town, barangayId: null })}
      />
      <Select
        label="Barangay"
        placeholder={draft.town ? 'Choose your barangay' : 'Choose a town first'}
        disabled={!draft.town}
        options={townBarangays.map((b) => ({ value: b.id, label: b.name }))}
        value={draft.barangayId}
        onChange={(barangayId) => set({ barangayId })}
      />
      <View style={styles.fieldWithCheck}>
        <Text variant="labelLarge" color="onSurfaceVariant">
          Home location
        </Text>
        {draft.location ? (
          <View style={styles.saved}>
            <Icon name="check" weight="bold" color="onReliefContainer" />
            <Text variant="titleMedium" style={[styles.flex, { color: c.onReliefContainer }]}>
              Saved
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Update home location"
              onPress={() => void locate()}
              style={styles.updateButton}
            >
              <Text variant="titleSmall" style={{ color: c.onReliefContainer }}>
                {locating ? 'Updating…' : 'Update'}
              </Text>
            </Pressable>
          </View>
        ) : problem ? (
          <LocationPrompt problem={problem} onRetry={locate} />
        ) : (
          <Button
            label="Use my current location"
            variant="secondary"
            loading={locating}
            onPress={() => void locate()}
          />
        )}
        <Text variant="bodyMedium" color="onSurfaceVariant">
          Save it while you are at home.
        </Text>
        {locationError ? <Text color="error">{locationError}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fields: { gap: 20 },
  fieldWithCheck: { gap: 6 },
  saved: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: c.reliefContainer,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingLeft: space.lg,
    paddingRight: space.xs,
  },
  updateButton: {
    height: 48,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
