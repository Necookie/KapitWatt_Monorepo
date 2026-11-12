import { RegisterHouseholdInput } from '@kapitwatt/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { BackHandler, useWindowDimensions, View } from 'react-native';
import { describeError, errorCode } from '@/api/http';
import { useBarangays, useRegister } from '@/api/queries';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { startOver } from '@/utils/nav';
import {
  EMPTY_DRAFT,
  STEPS,
  givenName,
  litAt,
  stepDone,
  toSignUp,
  type Draft,
  type StepId,
} from '../utils/draft';
import { lanternInMascot } from '../utils/heading-mascot';
import { lanternCentre } from '../utils/lantern-street';
import { REFUSALS } from '../utils/refusals';
import { STEP_MASCOT } from '../utils/step-mascot';
import { useSpark } from './useSpark';

/**
 * The sign-up flow's state: the step, the draft, the lanterns lit and Alitaptap's mood, with the
 * moves between steps (spark on Continue, straight back) and the final "Join the pilot".
 */
export function useSignUp() {
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
  const stepProps = { draft, set };
  const mascot = STEP_MASCOT[step];
  const firstName = givenName(draft.accountName);
  const line =
    step === 'review' && firstName ? `All lit, ${firstName}. Ready to join?` : mascot.line;
  const home = barangays.data?.find((b) => b.id === draft.barangayId)?.name ?? null;

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

  return {
    barangays,
    joining: registerMutation.isPending,
    step,
    index,
    stepProps,
    problem,
    eyesShut,
    setEyesShut,
    cheer,
    lit,
    celebrate: lit === STEPS.length,
    backLabel: index === 0 ? 'Cancel sign-up' : 'Back to the previous step',
    spark,
    street,
    mascotBox,
    done,
    canJoin: stepDone('review', draft),
    needsConsent: step === 'privacy' && !stepDone('privacy', draft),
    mascot,
    line,
    home,
    go,
    advance,
    back,
    join,
  };
}
