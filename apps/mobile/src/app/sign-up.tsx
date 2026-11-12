import { RegisterHouseholdInput } from '@kapitwatt/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
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
  StepHeader,
} from '@/components/onboarding/Steps';
import { Button, ErrorState, Loading, Screen, SimulatedNote } from '@/components/ui';
import { errorCode } from '@/lib/api';
import { useBarangays, useRegister } from '@/lib/queries';
import { colors, text } from '@/theme';

/** Where a refused sign-up sends the household back to, and what it is told. */
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
 * Nothing is sent to the API until "Join the pilot".
 */
export default function SignUpScreen() {
  const barangays = useBarangays();
  const registerMutation = useRegister();
  const [step, setStep] = useState<StepId>('account');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [problem, setProblem] = useState<string | null>(null);

  if (barangays.isPending) return <Loading />;
  if (barangays.isError) return <ErrorState onRetry={() => void barangays.refetch()} />;

  const set = (changes: Partial<Draft>) => {
    setProblem(null);
    setDraft((d) => ({ ...d, ...changes }));
  };
  const index = STEPS.indexOf(step);
  const props = { draft, set };

  const join = () => {
    const parsed = RegisterHouseholdInput.safeParse(toSignUp(draft));
    if (!parsed.success) return;
    registerMutation.mutate(parsed.data, {
      onSuccess: (res) => router.replace(res.household.needsRehearsal ? '/rehearsal' : '/'),
      onError: (e) => {
        const refusal = REFUSALS[errorCode(e) ?? ''];
        if (refusal) setStep(refusal.step);
        setProblem(
          refusal?.message ?? 'Could not sign you up. Check your connection and try again.',
        );
      },
    });
  };

  return (
    <Screen>
      <StepHeader step={step} />
      {problem ? <Text style={styles.error}>{problem}</Text> : null}

      {step === 'account' ? <AccountStep {...props} /> : null}
      {step === 'privacy' ? <PrivacyStep {...props} /> : null}
      {step === 'meralco' ? <MeralcoStep {...props} /> : null}
      {step === 'home' ? <HomeStep {...props} barangays={barangays.data} /> : null}
      {step === 'meter' ? <MeterStep {...props} /> : null}
      {step === 'review' ? (
        <ReviewStep {...props} barangays={barangays.data} onEdit={setStep} />
      ) : null}

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
        <Text style={styles.body}>You can’t join without consent.</Text>
      ) : null}
      <Button
        label={index === 0 ? 'Cancel' : 'Back'}
        variant="secondary"
        disabled={registerMutation.isPending}
        onPress={() => (index === 0 ? router.back() : setStep(STEPS[index - 1]!))}
      />
      {step === 'account' ? (
        <Button
          label="I already have an account"
          variant="secondary"
          onPress={() => router.replace('/login')}
        />
      ) : null}
      <SimulatedNote>
        KapitWatt is a hackathon pilot. Households, alerts and reward rates are simulated.
      </SimulatedNote>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...text.body, color: colors.muted },
  error: { ...text.body, color: colors.red },
});
