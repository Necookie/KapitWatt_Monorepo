import { Button, Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { space } from '@kapitwatt/tokens';

import type { StepId } from '../utils/draft';

/** The foot of each step: Continue (or Join the pilot at review), with the step's short notes. */
export function StepActions(props: {
  step: StepId;
  done: boolean;
  canJoin: boolean;
  joining: boolean;
  needsConsent: boolean;
  onJoin: () => void;
  onContinue: () => void;
}) {
  const { step } = props;
  return (
    <View style={styles.actions}>
      {step === 'review' ? (
        <Button
          size="lg"
          fullWidth
          label="Join the pilot"
          disabled={!props.canJoin}
          loading={props.joining}
          onPress={props.onJoin}
        />
      ) : (
        <Button
          size="lg"
          fullWidth
          label="Continue"
          disabled={!props.done}
          onPress={props.onContinue}
        />
      )}
      {step === 'review' ? (
        <Text variant="bodySmall" color="onSurfaceVariant" align="center">
          Nothing is sent until you tap Join.
        </Text>
      ) : null}
      {props.needsConsent ? (
        <Text variant="bodySmall" color="onSurfaceVariant" align="center">
          Both are needed to join.
        </Text>
      ) : null}
      {step === 'account' ? (
        <View style={styles.loginRow}>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            Have an account?
          </Text>
          <Button variant="text" label="Log in" onPress={() => router.replace('/login')} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { marginTop: 'auto', gap: space[1] },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
