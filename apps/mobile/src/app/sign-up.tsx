import { RegisterHouseholdInput } from '@kapitwatt/shared';
import { Text } from '@kapitwatt/ui';
import { themes } from '@kapitwatt/styles';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { BackHandler, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  EMPTY_DRAFT,
  STEPS,
  stepDone,
  toSignUp,
  givenName,
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
  STEP_MASCOT,
  STEP_TITLE,
} from '@/components/onboarding/Steps';
import { LanternStreet, lanternCentre, SHEET_OVERLAP } from '@/components/onboarding/LanternStreet';
import { Spark, useSpark } from '@/components/onboarding/Spark';
import { lanternInMascot, StepHeading } from '@/components/onboarding/StepHeading';
import { Button, ErrorState, Loading, Screen } from '@/components/ui';
import { describeError, errorCode } from '@/lib/api';
import { startOver } from '@/lib/nav';
import { useBarangays, useRegister } from '@/lib/queries';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { space } from '@/theme';

const c = themes.light.color;

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
 *
 * Layout, the lantern path: welcome's night street stays on top with six lanterns on its power
 * line, one per step; the steps sit on the white sheet that rose from welcome. Each "Continue"
 * sends a spark from Alitaptap's lantern up to the next lantern; back dims it again. Alitaptap
 * shuts its eyes while the password is typed and hops when a step is complete. The barangay goes
 * on the street sign with a pin on your window, and at review the whole street lights up.
 */
export default function SignUpScreen() {
  const barangays = useBarangays();
  const registerMutation = useRegister();
  const [step, setStep] = useState<StepId>('account');
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [problem, setProblem] = useState<string | null>(null);
  const [eyesShut, setEyesShut] = useState(false);
  const [cheer, setCheer] = useState(0);
  /** Lanterns lit: a step's lantern lights when the spark lands in it. */
  const [lit, setLit] = useState(0);
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const spark = useSpark();
  const street = useRef<ComponentRef<typeof View>>(null);
  const mascotBox = useRef<ComponentRef<typeof View>>(null);
  const index = STEPS.indexOf(step);
  const done = stepDone(step, draft);

  // A hop each time a step becomes complete (and on arriving at one that already is).
  useEffect(() => {
    if (done) setCheer((n) => n + 1);
  }, [done, step]);

  // Android back button: one step back, not out of onboarding (which would lose what was typed).
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (index === 0) return false;
        setEyesShut(false);
        setStep(STEPS[index - 1]!);
        setLit(index - 1);
        return true;
      });
      return () => sub.remove();
    }, [index]),
  );

  const set = (changes: Partial<Draft>) => {
    setProblem(null);
    setDraft((d) => ({ ...d, ...changes }));
  };
  const props = { draft, set };
  const mascot = STEP_MASCOT[step];
  const firstName = givenName(draft.accountName);
  const line =
    step === 'review' && firstName ? `All lit, ${firstName}. Ready to join?` : mascot.line;
  const home = barangays.data?.find((b) => b.id === draft.barangayId)?.name ?? null;

  /** Lanterns lit on reaching a step: one per finished step, all six at review. */
  const litAt = (s: StepId) => (s === 'review' ? STEPS.length : STEPS.indexOf(s));

  const show = (to: StepId) => {
    setEyesShut(false);
    setStep(to);
  };
  /** Straight to a step (back, edit from review): its lanterns at once. */
  const go = (to: StepId) => {
    show(to);
    setLit(litAt(to));
  };

  const advance = () => {
    const to = STEPS[index + 1]!;
    setProblem(null);
    if (reduced) return go(to);
    void spark.fly(
      { ref: mascotBox, offset: lanternInMascot() },
      { ref: street, offset: lanternCentre(index, width) },
      () => show(to),
      () => setLit(litAt(to)),
    );
  };

  const back = () => {
    setProblem(null);
    if (index > 0) go(STEPS[index - 1]!);
    else if (router.canGoBack()) router.back();
    else router.replace('/welcome');
  };

  const join = () => {
    const parsed = RegisterHouseholdInput.safeParse(toSignUp(draft));
    if (!parsed.success) return;
    setProblem(null);
    registerMutation.mutate(parsed.data, {
      onSuccess: (res) => startOver(res.household.needsRehearsal ? '/rehearsal' : '/'),
      onError: (e) => {
        const refusal = REFUSALS[errorCode(e) ?? ''];
        if (refusal) go(refusal.step);
        setProblem(
          refusal?.message ?? describeError(e, {}, 'Could not sign you up. Try again in a moment.'),
        );
      },
    });
  };

  const body = barangays.isPending ? (
    <Loading />
  ) : barangays.isError ? (
    <ErrorState onRetry={() => void barangays.refetch()} />
  ) : (
    // Keyed by step so every step opens scrolled to the top.
    <Screen key={step} roomy>
      <StepHeading
        ref={mascotBox}
        label={STEP_TITLE[step]}
        line={line}
        pose={mascot.pose}
        reward={mascot.tone === 'reward'}
        eyesShut={eyesShut}
        cheer={cheer}
      />
      {problem ? <Text color="error">{problem}</Text> : null}

      {step === 'account' ? <AccountStep {...props} onPasswordFocus={setEyesShut} /> : null}
      {step === 'privacy' ? <PrivacyStep {...props} /> : null}
      {step === 'meralco' ? <MeralcoStep {...props} /> : null}
      {step === 'home' ? <HomeStep {...props} barangays={barangays.data} /> : null}
      {step === 'meter' ? <MeterStep {...props} /> : null}
      {step === 'review' ? <ReviewStep {...props} barangays={barangays.data} onEdit={go} /> : null}

      <View style={styles.actions}>
        {step === 'review' ? (
          <Button
            label="Join the pilot"
            disabled={!stepDone('review', draft)}
            loading={registerMutation.isPending}
            onPress={join}
          />
        ) : (
          <Button label="Continue" disabled={!done} onPress={advance} />
        )}
        {step === 'review' ? (
          <Text variant="bodySmall" color="onSurfaceVariant" align="center">
            Nothing is sent until you tap Join.
          </Text>
        ) : null}
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
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LanternStreet
        ref={street}
        step={index}
        lit={lit}
        home={home}
        celebrate={lit === STEPS.length}
        onBack={back}
        backLabel={index === 0 ? 'Cancel sign-up' : 'Back to the previous step'}
        disabled={registerMutation.isPending}
      />
      <View style={styles.sheet}>{body}</View>
      <Spark {...spark} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.brand },
  // The white sheet that rose from welcome: it covers the foot of the street.
  sheet: {
    flex: 1,
    marginTop: -SHEET_OVERLAP,
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  actions: { marginTop: 'auto', gap: space.xs },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
