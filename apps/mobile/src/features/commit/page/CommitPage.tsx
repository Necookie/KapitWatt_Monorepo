import { Button, Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { space } from '@kapitwatt/tokens';
import { ErrorState, Loading } from '@/components/ui';
import { BandScreen } from '@/layout/components/BandScreen';
import { formatKw } from '@/utils/format';
import { CommitBand } from '../components/CommitBand';
import { CommitLimits } from '../components/CommitLimits';
import { CommitReward } from '../components/CommitReward';
import { KwPresets } from '../components/KwPresets';
import { KwStepper } from '../components/KwStepper';
import { useCommitForm } from '../hooks/useCommitForm';

/**
 * Commit a cut, in the tabs' frame: the question in the night band over the street, whose windows
 * go dark as the household raises its kW (all dark at its limit), like the welcome try-it. On the
 * sheet: the kW with the stepper and presets, what it means for the window, what a verified cut
 * earns, and the button.
 */
export default function CommitPage() {
  const form = useCommitForm();

  if (form.state !== 'ready') {
    return (
      <BandScreen band={null} cut={form.street}>
        {form.state === 'pending' ? <Loading /> : <ErrorState onRetry={form.retry} />}
      </BandScreen>
    );
  }

  return (
    <BandScreen
      cut={form.street}
      band={<CommitBand windowStart={form.windowStart} windowEnd={form.windowEnd} />}
    >
      <KwStepper selected={form.selected} cap={form.cap} onSet={form.set} />
      <KwPresets selected={form.selected} cap={form.cap} onSet={form.set} />
      <CommitLimits selected={form.selected} cap={form.cap} hours={form.hours} />
      <CommitReward />

      <View style={styles.actions}>
        {form.error ? <Text color="error">{form.error}</Text> : null}
        <Button
          size="lg"
          fullWidth
          label={`Commit ${formatKw(form.selected)}`}
          loading={form.saving}
          disabled={form.cap <= 0}
          onPress={form.submit}
        />
      </View>
    </BandScreen>
  );
}

const styles = StyleSheet.create({
  actions: { marginTop: 'auto', gap: space[2] },
});
