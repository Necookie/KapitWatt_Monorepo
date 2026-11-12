import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { Button, ErrorState, Loading, Screen } from '@/components/ui';
import { formatKw, formatWindow } from '@/utils/format';
import { space } from '@/styles/theme';
import { CommitLimits } from '../components/CommitLimits';
import { KwPresets } from '../components/KwPresets';
import { KwStepper } from '../components/KwStepper';
import { useCommitForm } from '../hooks/useCommitForm';

/**
 * Commit a cut in kW, never a list of appliances (FR-APP-07, 08; mockup "Commit a cut").
 * The API enforces the cap too.
 */
export default function CommitPage() {
  const form = useCommitForm();

  if (form.state === 'pending') return <Loading />;
  if (form.state === 'error') return <ErrorState onRetry={form.retry} />;

  return (
    <Screen roomy>
      <MascotHeader
        label="Commit a cut"
        line={`How much can you cut, ${formatWindow(form.windowStart, form.windowEnd)}?`}
      />

      <KwStepper selected={form.selected} cap={form.cap} onSet={form.set} />

      <KwPresets selected={form.selected} cap={form.cap} onSet={form.set} />

      <CommitLimits cap={form.cap} />

      <View style={styles.actions}>
        {form.error ? <Text color="error">{form.error}</Text> : null}
        <Button
          label={`Commit ${formatKw(form.selected)}`}
          loading={form.saving}
          disabled={form.cap <= 0}
          onPress={form.submit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { marginTop: 'auto', gap: space.sm },
});
