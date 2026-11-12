import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SHEET_OVERLAP } from '@/components/night/geometry';
import { ErrorState, Loading, Screen } from '@/components/ui';
import { AccountStep } from '../components/AccountStep';
import { HomeStep } from '../components/HomeStep';
import { LanternStreet } from '../components/LanternStreet';
import { MeralcoStep } from '../components/MeralcoStep';
import { MeterStep } from '../components/MeterStep';
import { PrivacyStep } from '../components/PrivacyStep';
import { ReviewStep } from '../components/ReviewStep';
import { Spark } from '../components/Spark';
import { StepActions } from '../components/StepActions';
import { StepHeading } from '../components/StepHeading';
import { useSignUp } from '../hooks/useSignUp';
import { STEP_TITLE } from '../utils/draft';

const c = themes.light.color;

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
export default function SignUpPage() {
  const {
    barangays,
    joining,
    step,
    index,
    stepProps,
    problem,
    eyesShut,
    setEyesShut,
    cheer,
    lit,
    celebrate,
    backLabel,
    spark,
    street,
    mascotBox,
    done,
    canJoin,
    needsConsent,
    mascot,
    line,
    home,
    go,
    advance,
    back,
    join,
  } = useSignUp();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LanternStreet
        ref={street}
        step={index}
        lit={lit}
        home={home}
        celebrate={celebrate}
        onBack={back}
        backLabel={backLabel}
        disabled={joining}
      />
      <View style={styles.sheet}>
        {barangays.isPending ? (
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

            {step === 'account' ? (
              <AccountStep {...stepProps} onPasswordFocus={setEyesShut} />
            ) : null}
            {step === 'privacy' ? <PrivacyStep {...stepProps} /> : null}
            {step === 'meralco' ? <MeralcoStep {...stepProps} /> : null}
            {step === 'home' ? <HomeStep {...stepProps} barangays={barangays.data} /> : null}
            {step === 'meter' ? <MeterStep {...stepProps} /> : null}
            {step === 'review' ? (
              <ReviewStep {...stepProps} barangays={barangays.data} onEdit={go} />
            ) : null}

            <StepActions
              step={step}
              done={done}
              canJoin={canJoin}
              joining={joining}
              needsConsent={needsConsent}
              onJoin={join}
              onContinue={advance}
            />
          </Screen>
        )}
      </View>
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
});
