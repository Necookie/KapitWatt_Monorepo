import { RegisterHouseholdInput } from '@kapitwatt/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, StyleSheet, Text } from 'react-native';
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
import { describeError, errorCode } from '@/lib/api';
import { startOver } from '@/lib/nav';
import { useBarangays, useRegister } from '@/lib/queries';
import { colors, text } from '@/theme';

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
 * Nothing is sent to the API until "Join the pilot".
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
    // Keyed by step so every step opens scrolled to the top.
    <Screen key={step}>
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
        onPress={() => {
          if (index > 0) setStep(STEPS[index - 1]!);
          else if (router.canGoBack()) router.back();
          else router.replace('/welcome');
        }}
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
