import { Icon } from '@kapitwatt/icons';
import {
  ACCOUNT_NUMBER_DIGITS,
  PASSWORD_MIN_LENGTH,
  PILOT_TOWNS,
  type Barangay,
  type MeterType,
} from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationPrompt } from '@/components/LocationPrompt';
import type { MascotPose } from '@/components/mascot/poses';
import {
  ALERTS_CONSENT_LABEL,
  DATA_CONSENT_LABEL,
  PRIVACY_SUMMARY,
} from '@/components/privacy/PrivacyNotice';
import { Button, Checkbox, Select, TextField } from '@/components/ui';
import { currentPosition, LocationError, type LocationProblem } from '@/lib/location';
import { radius, space } from '@/theme';
import { fieldOk, STEP_TITLE, STEPS, type StepId, type StepProps } from './draft';

/**
 * The onboarding steps, laid out as in the mockups (sign-up, mascot option A): the mascot talks in
 * the header, each step keeps only the fields and the few hints people need.
 * The sign-up screen decides which step shows and when to move on.
 */

const c = themes.light.color;

/** What the mascot says on each step. The label is the step's name; the line is the heading. */
export const STEP_MASCOT: Record<
  StepId,
  { line: string; pose: MascotPose; tone: 'primary' | 'reward' }
> = {
  account: { line: 'Hi! First, set up your login.', pose: 'neutral', tone: 'primary' },
  privacy: { line: 'Your data stays safe with us.', pose: 'neutral', tone: 'primary' },
  meralco: { line: 'Grab your bill. It has everything we need.', pose: 'neutral', tone: 'primary' },
  home: { line: "Where's home? Pick your barangay.", pose: 'neutral', tone: 'primary' },
  meter: { line: 'Check your meter. Which kind is it?', pose: 'neutral', tone: 'primary' },
  review: { line: 'Almost there! Check your details.', pose: 'reward', tone: 'reward' },
};

export { STEP_TITLE };

const METER_LABEL: Record<MeterType, string> = { standard: 'Regular', ami: 'Smart' };

/** Back arrow, "3 of 6" and a segmented progress bar. Replaces the stack header on sign-up. */
export function SignUpTopBar(props: { step: StepId; onBack: () => void; disabled?: boolean }) {
  const insets = useSafeAreaInsets();
  const index = STEPS.indexOf(props.step);
  return (
    <View style={[styles.topBar, { paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={index === 0 ? 'Cancel sign-up' : 'Back to the previous step'}
          disabled={props.disabled}
          onPress={props.onBack}
          style={styles.iconButton}
        >
          <Icon name="back" />
        </Pressable>
        <Text variant="labelLarge" color="onSurfaceVariant">
          {index + 1} of {STEPS.length}
        </Text>
      </View>
      <View
        style={styles.segments}
        accessibilityRole="progressbar"
        accessibilityLabel={`Step ${index + 1} of ${STEPS.length}`}
        accessibilityValue={{ min: 1, max: STEPS.length, now: index + 1 }}
      >
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[styles.segment, { backgroundColor: i <= index ? c.primary : c.outlineVariant }]}
          />
        ))}
      </View>
    </View>
  );
}

/** A rule shown as it is met: grey circle while not yet, green tick once it holds. */
function LiveCheck(props: { ok: boolean; children: string }) {
  return (
    <View style={styles.check}>
      <Icon
        name={props.ok ? 'check' : 'pending'}
        size="sm"
        weight={props.ok ? 'bold' : 'regular'}
        color={props.ok ? 'relief' : 'onSurfaceVariant'}
      />
      <Text variant="bodyMedium" color={props.ok ? 'relief' : 'onSurfaceVariant'}>
        {props.children}
      </Text>
    </View>
  );
}

export function AccountStep({ draft, set }: StepProps) {
  const emailWrong = draft.email.length > 0 && !fieldOk('email', draft.email);
  return (
    <View style={styles.fields}>
      <TextField
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        error={emailWrong ? 'Enter a valid email address.' : undefined}
        value={draft.email}
        onChangeText={(email) => set({ email })}
      />
      <View style={styles.fieldWithCheck}>
        <TextField
          label="Password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          value={draft.password}
          onChangeText={(password) => set({ password })}
        />
        <LiveCheck ok={fieldOk('password', draft.password)}>
          {`${PASSWORD_MIN_LENGTH} characters or more`}
        </LiveCheck>
      </View>
    </View>
  );
}

export function PrivacyStep({ draft, set }: StepProps) {
  return (
    <>
      <View style={styles.panel}>
        {PRIVACY_SUMMARY.map((row) => (
          <View key={row.icon} style={styles.summaryRow}>
            <Icon name={row.icon} color="primary" />
            <Text variant="bodyMedium" style={styles.flex}>
              {row.text}
            </Text>
          </View>
        ))}
        <Button
          label="Read the full notice"
          variant="text"
          onPress={() => router.push('/privacy')}
        />
      </View>
      <View style={styles.consents}>
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
      </View>
    </>
  );
}

export function MeralcoStep({ draft, set }: StepProps) {
  const numberWrong =
    draft.accountNumber.length > 0 && !fieldOk('accountNumber', draft.accountNumber);
  return (
    <View style={styles.fields}>
      <TextField
        label="Account number (CAN)"
        hint="On your bill"
        error={numberWrong ? `The account number has ${ACCOUNT_NUMBER_DIGITS} digits.` : undefined}
        keyboardType="number-pad"
        maxLength={ACCOUNT_NUMBER_DIGITS}
        suffix={`${draft.accountNumber.length}/${ACCOUNT_NUMBER_DIGITS}`}
        value={draft.accountNumber}
        onChangeText={(value) => set({ accountNumber: value.replace(/\D/g, '') })}
      />
      <TextField
        label="Account holder"
        autoCapitalize="words"
        autoCorrect={false}
        value={draft.accountName}
        onChangeText={(accountName) => set({ accountName })}
      />
      <TextField
        label="Service address"
        placeholder="House no. and street"
        autoCapitalize="words"
        value={draft.serviceAddress}
        onChangeText={(serviceAddress) => set({ serviceAddress })}
      />
    </View>
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
    <View style={styles.fields}>
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
      <View style={styles.fieldWithCheck}>
        <Text variant="labelLarge" color="onSurfaceVariant">
          Home location
        </Text>
        {draft.location ? (
          <View style={styles.saved}>
            <Icon name="check" weight="bold" color="onReliefContainer" />
            <Text variant="titleMedium" style={[styles.flex, { color: c.onReliefContainer }]}>
              Saved
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Update home location"
              onPress={() => void locate()}
              style={styles.updateButton}
            >
              <Text variant="titleSmall" style={{ color: c.onReliefContainer }}>
                {locating ? 'Updating…' : 'Update'}
              </Text>
            </Pressable>
          </View>
        ) : problem ? (
          <LocationPrompt problem={problem} onRetry={locate} />
        ) : (
          <Button
            label="Use my current location"
            variant="secondary"
            loading={locating}
            onPress={() => void locate()}
          />
        )}
        <Text variant="bodyMedium" color="onSurfaceVariant">
          Save it while you are at home.
        </Text>
        {locationError ? <Text color="error">{locationError}</Text> : null}
      </View>
    </View>
  );
}

function MeterCard(props: {
  title: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
      accessibilityLabel={`${props.title} meter, ${props.detail}`}
      onPress={props.onPress}
      style={[styles.meterCard, props.selected ? styles.meterCardOn : styles.meterCardOff]}
    >
      <Text
        variant="titleMedium"
        style={{ color: props.selected ? c.onPrimaryContainer : c.onSurface }}
      >
        {props.title}
      </Text>
      <Text
        variant="bodyMedium"
        style={{ color: props.selected ? c.onPrimaryContainer : c.onSurfaceVariant }}
      >
        {props.detail}
      </Text>
    </Pressable>
  );
}

export function MeterStep({ draft, set }: StepProps) {
  return (
    <View style={styles.fields}>
      <View style={styles.fieldWithCheck}>
        <Text variant="labelLarge" color="onSurfaceVariant">
          Meter type
        </Text>
        <View style={styles.meterRow} accessibilityRole="radiogroup">
          <MeterCard
            title="Regular"
            detail="2 photos per event"
            selected={draft.meterType === 'standard'}
            onPress={() => set({ meterType: 'standard' })}
          />
          <MeterCard
            title="Smart"
            detail="No photos"
            selected={draft.meterType === 'ami'}
            onPress={() => set({ meterType: 'ami' })}
          />
        </View>
      </View>
      <TextField
        label="Serial number"
        hint="Printed on the meter"
        autoCapitalize="characters"
        autoCorrect={false}
        value={draft.meterSerial}
        onChangeText={(meterSerial) => set({ meterSerial })}
      />
      <TextField
        label="Monthly use"
        hint="On your bill"
        keyboardType="number-pad"
        placeholder="250"
        suffix="kWh"
        value={draft.billText}
        onChangeText={(billText) => set({ billText })}
      />
    </View>
  );
}

function ReviewRow(props: {
  label: string;
  lines: string[];
  good?: string;
  onEdit: () => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.reviewRow, !props.last && styles.reviewDivider]}>
      <View style={styles.flex}>
        <Text variant="labelMedium" color="onSurfaceVariant">
          {props.label}
        </Text>
        {props.lines.map((line, i) => (
          <Text
            key={i}
            variant={i === 0 ? 'bodyLarge' : 'bodyMedium'}
            color={i === 0 ? 'onSurface' : 'onSurfaceVariant'}
          >
            {line}
          </Text>
        ))}
        {props.good ? (
          <Text variant="titleSmall" color="relief">
            {props.good}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${props.label.toLowerCase()}`}
        onPress={props.onEdit}
        style={styles.updateButton}
      >
        <Text variant="titleSmall" color="primary">
          Edit
        </Text>
      </Pressable>
    </View>
  );
}

/** Everything entered, with a way back to each step. The account number is masked. */
export function ReviewStep(
  props: StepProps & { barangays: Barangay[]; onEdit: (step: StepId) => void },
) {
  const { draft, barangays, onEdit } = props;
  const barangay = barangays.find((b) => b.id === draft.barangayId);
  const masked = '••••' + draft.accountNumber.slice(-4);
  return (
    <View style={[styles.panel, styles.reviewPanel]}>
      <ReviewRow
        label="Login"
        lines={[draft.email.trim().toLowerCase()]}
        onEdit={() => onEdit('account')}
      />
      <ReviewRow
        label="Meralco account"
        lines={[`${draft.accountName.trim()} · ${masked}`, draft.serviceAddress.trim()]}
        onEdit={() => onEdit('meralco')}
      />
      <ReviewRow
        label="Where you live"
        lines={[barangay ? `${barangay.name}, ${barangay.municipality}` : 'Barangay missing']}
        good={draft.location ? 'Home location saved' : undefined}
        onEdit={() => onEdit('home')}
      />
      <ReviewRow
        label="Meter"
        lines={[
          `${draft.meterType ? METER_LABEL[draft.meterType] : ''} · ${draft.meterSerial.trim()}`,
          `${draft.billText} kWh a month`,
        ]}
        onEdit={() => onEdit('meter')}
      />
      <ReviewRow
        label="Consent"
        lines={[]}
        good={draft.consent && draft.alertsConsent ? 'Data and alerts: given' : undefined}
        onEdit={() => onEdit('privacy')}
        last
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { backgroundColor: c.surface, paddingBottom: space.sm, gap: space.xs },
  topRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: space.xs,
    paddingRight: 20,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segments: { flexDirection: 'row', gap: space.xs, paddingHorizontal: space.xl },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  fields: { gap: 20 },
  fieldWithCheck: { gap: 6 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  panel: {
    backgroundColor: c.surfaceContainerLow,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: 14,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  consents: { gap: space.md },
  saved: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: c.reliefContainer,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingLeft: space.lg,
    paddingRight: space.xs,
  },
  updateButton: {
    height: 48,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meterRow: { flexDirection: 'row', gap: space.md },
  meterCard: { flex: 1, borderRadius: radius.md, padding: 14, gap: space.xs },
  meterCardOn: { borderWidth: 2, borderColor: c.primary, backgroundColor: c.primaryContainer },
  meterCardOff: {
    borderWidth: 1,
    borderColor: c.outline,
    backgroundColor: c.surfaceContainerLowest,
    margin: 1,
  },
  reviewPanel: { paddingVertical: space.xs, gap: 0 },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  reviewDivider: { borderBottomWidth: 1, borderBottomColor: c.outlineVariant },
});
