import { RegisterHouseholdInput } from '@kapitwatt/shared';
import { Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import {
  EMPTY_DRAFT,
  STEPS,
  stepDone,
  toSignUp,
  type Draft,
  type StepId,
} from '@/components/onboarding/draft';
import {
  AccountStep,
  HomeStep,
  MeralcoStep,
  MeterStep,
  PrivacyStep,
  ReviewStep,
  SignUpTopBar,
  STEP_MASCOT,
  STEP_TITLE,
} from '@/components/onboarding/Steps';
import { Button, ErrorState, Loading, Screen } from '@/components/ui';
import { errorCode } from '@/lib/api';
import { useBarangays, useRegister } from '@/lib/queries';
import { colors, space } from '@/theme';

/** Refusals that belong to one step: the household is sent back there to fix it. */
const REFUSALS: Record<string, { step: StepId; message: string }> = {
  email_taken: {
    step: 'account',
    message: 'That email already has an account. Log in instead, or use another email.',
  },
  account_taken: {
    step: 'meralco',
    message: 'That Meralco account is already enrolled. Check the number, or log in.',
  },
  unknown_barangay: { step: 'home', message: 'That barangay is not in the pilot.' },
};

/**
 * Onboarding (FR-APP-01 to 03): account, privacy notice and consent, Meralco account, home, meter,
 * review. The consent step comes before any personal data beyond the email, and cannot be skipped.
 * Nothing is sent to the API until "Join the pilot". Layout: mockup sign-up, mascot option A.
 */
export default function SignUpScreen() {
  const barangays = useBarangays();
  const registerMutation = useRegister();
  const [step, setStep] = useState<StepId>('account');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [problem, setProblem] = useState<string | null>(null);
  const index = STEPS.indexOf(step);

  // Android back button: one step back, not out of onboarding (which would lose what was typed).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (index === 0) return false;
        setStep(STEPS[index - 1]!);
        return true;
      });
      return () => sub.remove();
    }, [index]),
  );

  if (barangays.isPending) return <Loading />;
  if (barangays.isError) return <ErrorState onRetry={() => void barangays.refetch()} />;

  const set = (changes: Partial<Draft>) => {
    setProblem(null);
    setDraft((d) => ({ ...d, ...changes }));
  };
  const props = { draft, set };
  const mascot = STEP_MASCOT[step];

  const back = () => {
    setProblem(null);
    if (index === 0) router.back();
    else setStep(STEPS[index - 1]!);
  };

  const join = () => {
    const parsed = RegisterHouseholdInput.safeParse(toSignUp(draft));
    if (!parsed.success) return;
    setProblem(null);
    registerMutation.mutate(parsed.data, {
      onSuccess: (res) => startOver(res.household.needsRehearsal ? '/rehearsal' : '/'),
      onError: (e) => {
        const refusal = REFUSALS[errorCode(e) ?? ''];
        if (refusal) setStep(refusal.step);
        setProblem(
          refusal?.message ?? describeError(e, {}, 'Could not sign you up. Try again in a moment.'),
        );
      },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SignUpTopBar step={step} onBack={back} disabled={registerMutation.isPending} />
      <Screen roomy>
        <MascotHeader
          label={STEP_TITLE[step]}
          line={mascot.line}
          pose={mascot.pose}
          tone={mascot.tone}
        />
        {problem ? <Text color="error">{problem}</Text> : null}

        {step === 'account' ? <AccountStep {...props} /> : null}
        {step === 'privacy' ? <PrivacyStep {...props} /> : null}
        {step === 'meralco' ? <MeralcoStep {...props} /> : null}
        {step === 'home' ? <HomeStep {...props} barangays={barangays.data} /> : null}
        {step === 'meter' ? <MeterStep {...props} /> : null}
        {step === 'review' ? (
          <ReviewStep {...props} barangays={barangays.data} onEdit={setStep} />
        ) : null}

        <View style={styles.actions}>
          {step === 'review' ? (
            <Button
              label="Join the pilot"
              disabled={!stepDone('review', draft)}
              loading={registerMutation.isPending}
              onPress={join}
            />
          ) : (
            <Button
              label="Continue"
              disabled={!stepDone(step, draft)}
              onPress={() => setStep(STEPS[index + 1]!)}
            />
          )}
          {step === 'privacy' && !stepDone('privacy', draft) ? (
            <Text variant="bodySmall" color="onSurfaceVariant" align="center">
              Both are needed to join.
            </Text>
          ) : null}
          {step === 'account' ? (
            <View style={styles.loginRow}>
              <Text variant="bodyMedium" color="onSurfaceVariant">
                Have an account?
              </Text>
              <Button label="Log in" variant="text" onPress={() => router.replace('/login')} />
            </View>
          ) : null}
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  actions: { marginTop: 'auto', gap: space.xs },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
