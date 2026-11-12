import {
  PILOT_TOWNS,
  RegisterHouseholdInput,
  type MeterType,
  type PilotTown,
} from '@kapitwatt/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import {
  Button,
  Card,
  Checkbox,
  ErrorState,
  Loading,
  Row,
  Screen,
  Select,
  SimulatedNote,
  TextField,
} from '@/components/ui';
import { MOCK } from '@/lib/config';
import { LocationPrompt } from '@/components/LocationPrompt';
import { currentPosition, LocationError, type LocationProblem } from '@/lib/location';
import { useBarangays, useRegister } from '@/lib/queries';
import { colors, text } from '@/theme';

const CONSENT_TEXT =
  'I agree to receive grid alerts from KapitWatt and to the collection of my meter photos, ' +
  'meter readings and home location to verify my energy cuts. This data is personal data under ' +
  'the Data Privacy Act of 2012 (RA 10173). It is stored privately, kept only for a limited time, ' +
  'and results are shown per barangay, never per household.';

/** Santa Cruz town proper, used for an empty location in demo mode only. */
const DEMO_LOCATION = { lat: 14.2788, lng: 121.4161 };

const METER_OPTIONS = [
  { value: 'standard', label: 'Regular meter (photos)' },
  { value: 'ami', label: 'Smart meter' },
] as const satisfies readonly { value: MeterType; label: string }[];

/** Sign-up and opt-in (FR-APP-01 to 03). No consent, no account. Push token comes later. */
export default function SignUpScreen() {
  const barangays = useBarangays();
  const registerMutation = useRegister();

  const [town, setTown] = useState<PilotTown | null>(null);
  const [barangayId, setBarangayId] = useState<string | null>(null);
  const [meterType, setMeterType] = useState<MeterType | null>(null);
  const [meterSerial, setMeterSerial] = useState('');
  const [billText, setBillText] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationProblem, setLocationProblem] = useState<LocationProblem | null>(null);
  const [consent, setConsent] = useState(false);

  if (barangays.isPending) return <Loading />;
  if (barangays.isError) return <ErrorState onRetry={() => void barangays.refetch()} />;

  const townBarangays = barangays.data.filter((b) => b.municipality === town);
  const form = {
    barangayId,
    meterType,
    meterSerial: meterSerial.trim(),
    billAvgKwhMonth: Number(billText),
    lat: location?.lat,
    lng: location?.lng,
    consent,
  };
  // Demo only: while on mock data the button always works, and empty fields get sample values.
  // Remove with the mock once the API is live; real sign-up must never skip consent.
  const demoFilled = {
    barangayId: form.barangayId ?? barangays.data[0]?.id,
    meterType: form.meterType ?? 'standard',
    meterSerial: form.meterSerial || 'DEMO-123456',
    billAvgKwhMonth: form.billAvgKwhMonth > 0 ? form.billAvgKwhMonth : 720,
    lat: form.lat ?? DEMO_LOCATION.lat,
    lng: form.lng ?? DEMO_LOCATION.lng,
    consent: true,
  };
  // Validate with the same Zod schema the API uses.
  const parsed = RegisterHouseholdInput.safeParse(MOCK.account ? demoFilled : form);
  // Plain-language list of what still blocks the button.
  const missing = [
    !barangayId && 'town and barangay',
    !location && 'home location',
    !meterType && 'meter type',
    !meterSerial.trim() && 'meter serial',
    !(Number(billText) > 0) && 'monthly kWh',
    !consent && 'consent',
  ].filter(Boolean);

  const locate = async () => {
    setLocationError(null);
    setLocating(true);
    try {
      setLocation(await currentPosition());
      setLocationProblem(null);
    } catch (e) {
      if (e instanceof LocationError) setLocationProblem(e.problem);
      else setLocationError('Could not get your location. Try again outside or near a window.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.intro}>
        Join the Laguna pilot. When the grid is short of power, we alert you and pay you for the
        energy you save.
      </Text>

      <Card title="Where you live">
        <Select
          label="Town"
          placeholder="Choose your town"
          options={PILOT_TOWNS.map((t) => ({ value: t, label: t }))}
          value={town}
          onChange={(t) => {
            setTown(t);
            setBarangayId(null);
          }}
        />
        <Select
          label="Barangay"
          placeholder={town ? 'Choose your barangay' : 'Choose a town first'}
          disabled={!town}
          options={townBarangays.map((b) => ({ value: b.id, label: b.name }))}
          value={barangayId}
          onChange={setBarangayId}
        />
        {location ? (
          <Row label="Home location" value="Saved" strong />
        ) : (
          <>
            <Text style={styles.body}>
              Do this at home: meter photos are checked against this location.
            </Text>
            {locationProblem ? (
              <LocationPrompt problem={locationProblem} onRetry={locate} />
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

      <Card title="Your meter">
        <Select
          label="Meter type"
          placeholder="Choose your meter type"
          options={METER_OPTIONS}
          value={meterType}
          onChange={setMeterType}
        />
        <TextField
          label="Meter serial number"
          hint="Printed on the meter. It must be visible in your meter photos."
          autoCapitalize="characters"
          autoCorrect={false}
          value={meterSerial}
          onChangeText={setMeterSerial}
        />
        <TextField
          label="Average monthly use (kWh)"
          hint="From your Meralco bill. It sets the most you can be paid for."
          keyboardType="number-pad"
          placeholder="e.g. 250"
          value={billText}
          onChangeText={setBillText}
        />
      </Card>

      <Card title="Consent">
        <Checkbox checked={consent} onChange={setConsent} label={CONSENT_TEXT} />
      </Card>

      {registerMutation.isError ? (
        <Text style={styles.error}>
          Could not sign you up. Check your connection and try again.
        </Text>
      ) : null}

      {missing.length > 0 ? (
        <Text style={styles.body}>
          {MOCK.account
            ? `Demo: you can join now. Empty fields (${missing.join(', ')}) use sample values.`
            : `Still needed: ${missing.join(', ')}.`}
        </Text>
      ) : null}
      <Button
        label="Join the pilot"
        disabled={!parsed.success}
        loading={registerMutation.isPending}
        onPress={() => {
          if (!parsed.success) return;
          registerMutation.mutate(parsed.data, {
            onSuccess: (res) => router.replace(res.household.needsRehearsal ? '/rehearsal' : '/'),
          });
        }}
      />
      <SimulatedNote>
        KapitWatt is a hackathon pilot. Households, alerts and reward rates are simulated.
      </SimulatedNote>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { ...text.body, color: colors.ink },
  body: { ...text.body, color: colors.muted },
  error: { ...text.body, color: colors.red },
});
