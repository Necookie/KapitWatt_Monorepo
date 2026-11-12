import {
  ACCOUNT_NUMBER_DIGITS,
  PASSWORD_MIN_LENGTH,
  PILOT_TOWNS,
  type Barangay,
  type MeterType,
} from '@kapitwatt/shared';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LocationPrompt } from '@/components/LocationPrompt';
import {
  ALERTS_CONSENT_LABEL,
  DATA_CONSENT_LABEL,
  PrivacyNotice,
} from '@/components/privacy/PrivacyNotice';
import {
  Button,
  Card,
  Checkbox,
  PasswordField,
  Row,
  Select,
  SimulatedNote,
  TextField,
} from '@/components/ui';
import { currentPosition, LocationError, type LocationProblem } from '@/lib/location';
import { colors, space, text } from '@/theme';
import { fieldOk, STEP_TITLE, STEPS, type StepId, type StepProps } from './draft';

/** One card per onboarding step. The sign-up screen decides which one shows and when to move on. */

const METER_OPTIONS = [
  { value: 'standard', label: 'Regular meter (photos)' },
  { value: 'ami', label: 'Smart meter' },
] as const satisfies readonly { value: MeterType; label: string }[];

const METER_LABEL: Record<MeterType, string> = {
  standard: 'Regular meter (photos)',
  ami: 'Smart meter',
};

/** "Step 2 of 6" with a thin progress bar. */
export function StepHeader(props: { step: StepId }) {
  const index = STEPS.indexOf(props.step);
  return (
    <View style={styles.header}>
      <Text style={styles.caption}>
        Step {index + 1} of {STEPS.length}
      </Text>
      <Text style={styles.title}>{STEP_TITLE[props.step]}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${((index + 1) / STEPS.length) * 100}%` }]} />
      </View>
    </View>
  );
}

/** Shown under a field only once the household has typed something wrong into it. */
function Problem(props: { show: boolean; children: string }) {
  return props.show ? <Text style={styles.error}>{props.children}</Text> : null;
}

export function AccountStep({ draft, set }: StepProps) {
  return (
    <Card>
      <Text style={styles.body}>You will use this email and password to log in.</Text>
      <TextField
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        value={draft.email}
        onChangeText={(email) => set({ email })}
      />
      <Problem show={draft.email.length > 0 && !fieldOk('email', draft.email)}>
        Enter a valid email address.
      </Problem>
      <PasswordField
        label="Password"
        hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
        autoComplete="new-password"
        value={draft.password}
        onChangeText={(password) => set({ password })}
      />
      <Problem show={draft.password.length > 0 && !fieldOk('password', draft.password)}>
        {`Use at least ${PASSWORD_MIN_LENGTH} characters.`}
      </Problem>
      <PasswordField
        label="Confirm password"
        autoComplete="new-password"
        value={draft.confirmPassword}
        onChangeText={(confirmPassword) => set({ confirmPassword })}
      />
      <Problem show={draft.confirmPassword.length > 0 && draft.confirmPassword !== draft.password}>
        The two passwords do not match.
      </Problem>
    </Card>
  );
}

export function PrivacyStep({ draft, set }: StepProps) {
  return (
    <>
      <Card>
        <PrivacyNotice />
      </Card>
      <Card title="Your consent">
        <Checkbox
          checked={draft.consent}
          onChange={(consent) => set({ consent })}
          label={DATA_CONSENT_LABEL}
        />
        <Checkbox
          checked={draft.alertsConsent}
          onChange={(alertsConsent) => set({ alertsConsent })}
          label={ALERTS_CONSENT_LABEL}
        />
        <Text style={styles.body}>
          You cannot join without both. Nothing you type is stored until you tap “Join the pilot” on
          the last step.
        </Text>
      </Card>
    </>
  );
}

export function MeralcoStep({ draft, set }: StepProps) {
  return (
    <Card>
      <Text style={styles.body}>
        These are on your Meralco bill. Your reward is credited to this account.
      </Text>
      <TextField
        label="Customer Account Number (CAN)"
        hint={`The ${ACCOUNT_NUMBER_DIGITS}-digit account number on your bill.`}
        keyboardType="number-pad"
        maxLength={ACCOUNT_NUMBER_DIGITS}
        value={draft.accountNumber}
        onChangeText={(value) => set({ accountNumber: value.replace(/\D/g, '') })}
      />
      <Problem
        show={draft.accountNumber.length > 0 && !fieldOk('accountNumber', draft.accountNumber)}
      >
        {`The account number has ${ACCOUNT_NUMBER_DIGITS} digits.`}
      </Problem>
      <TextField
        label="Account holder’s name"
        hint="The registered name, exactly as printed on the bill."
        autoCapitalize="words"
        autoCorrect={false}
        value={draft.accountName}
        onChangeText={(accountName) => set({ accountName })}
      />
      <TextField
        label="Service address"
        hint="House number and street where the electricity is supplied. Town and barangay come next."
        autoCapitalize="words"
        value={draft.serviceAddress}
        onChangeText={(serviceAddress) => set({ serviceAddress })}
      />
      <SimulatedNote>
        These details are not checked against Meralco records in this pilot.
      </SimulatedNote>
    </Card>
  );
}

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
    <Card>
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
      {draft.location ? (
        <Row label="Home location" value="Saved" strong />
      ) : (
        <>
          <Text style={styles.body}>
            Do this at home: meter photos are checked against this location.
          </Text>
          {problem ? (
            <LocationPrompt problem={problem} onRetry={locate} />
          ) : (
            <Button
              label="Use my current location"
              variant="secondary"
              loading={locating}
              onPress={() => void locate()}
            />
          )}
        </>
      )}
      {locationError ? <Text style={styles.error}>{locationError}</Text> : null}
    </Card>
  );
}

export function MeterStep({ draft, set }: StepProps) {
  return (
    <Card>
      <Select
        label="Meter type"
        placeholder="Choose your meter type"
        options={METER_OPTIONS}
        value={draft.meterType}
        onChange={(meterType) => set({ meterType })}
      />
      <TextField
        label="Meter serial number"
        hint="Printed on the meter. It must be visible in your meter photos."
        autoCapitalize="characters"
        autoCorrect={false}
        value={draft.meterSerial}
        onChangeText={(meterSerial) => set({ meterSerial })}
      />
      <TextField
        label="Average monthly use (kWh)"
        hint="From your Meralco bill. It sets the most you can be paid for."
        keyboardType="number-pad"
        placeholder="e.g. 250"
        value={draft.billText}
        onChangeText={(billText) => set({ billText })}
      />
    </Card>
  );
}

/** Everything entered, with a way back to each step. The account number is masked. */
export function ReviewStep(
  props: StepProps & { barangays: Barangay[]; onEdit: (step: StepId) => void },
) {
  const { draft, barangays, onEdit } = props;
  const barangay = barangays.find((b) => b.id === draft.barangayId);
  const masked = '•'.repeat(ACCOUNT_NUMBER_DIGITS - 4) + draft.accountNumber.slice(-4);
  return (
    <>
      <Section title="Login" onEdit={() => onEdit('account')}>
        <Row label="Email" value={draft.email.trim().toLowerCase()} />
      </Section>
      <Section title="Meralco account" onEdit={() => onEdit('meralco')}>
        <Row label="Account number" value={masked} />
        <Row label="Account holder" value={draft.accountName.trim()} />
        <Row label="Service address" value={draft.serviceAddress.trim()} />
      </Section>
      <Section title="Where you live" onEdit={() => onEdit('home')}>
        <Row
          label="Barangay"
          value={barangay ? `${barangay.name}, ${barangay.municipality}` : ''}
        />
        <Row label="Home location" value={draft.location ? 'Saved' : 'Missing'} />
      </Section>
      <Section title="Your meter" onEdit={() => onEdit('meter')}>
        <Row label="Meter type" value={draft.meterType ? METER_LABEL[draft.meterType] : ''} />
        <Row label="Serial number" value={draft.meterSerial.trim()} />
        <Row label="Monthly use" value={`${draft.billText} kWh`} />
      </Section>
      <Section title="Consent" onEdit={() => onEdit('privacy')}>
        <Row label="Personal data" value={draft.consent ? 'Given' : 'Missing'} />
        <Row label="Grid alerts" value={draft.alertsConsent ? 'Given' : 'Missing'} />
      </Section>
    </>
  );
}

function Section(props: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <Card>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{props.title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${props.title}`}
          hitSlop={space.md}
          onPress={props.onEdit}
        >
          <Text style={styles.link}>Edit</Text>
        </Pressable>
      </View>
      {props.children}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.xs },
  caption: { ...text.caption, color: colors.muted },
  title: { ...text.headline, color: colors.ink },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginTop: space.xs,
  },
  fill: { height: 6, backgroundColor: colors.teal },
  body: { ...text.body, color: colors.muted },
  error: { ...text.caption, color: colors.red },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...text.title, color: colors.ink },
  link: { ...text.body, fontWeight: '700', color: colors.teal },
});
