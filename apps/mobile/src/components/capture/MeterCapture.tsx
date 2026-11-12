import type { MeterReading, ReadingFlag, ReadingKind } from '@kapitwatt/shared';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button, Card, TextField } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { LocationPrompt } from '@/components/LocationPrompt';
import { currentPosition, LocationError, type LocationProblem } from '@/lib/location';
import { useSubmitReading } from '@/lib/queries';
import { colors, radius, space, text } from '@/theme';

const FLAG_TEXT: Record<ReadingFlag, string> = {
  late: 'It arrived after the deadline.',
  serial_mismatch: 'The meter serial did not match your registered meter.',
  too_far: 'It was taken far from your registered address.',
  not_increasing: 'The reading is lower than your previous one.',
  implausible_draw: 'The reading is higher than your service could use in that time.',
  duplicate_photo: 'This photo was already used.',
  ocr_mismatch: 'The number in the photo looks different from what you typed.',
};

/**
 * Meter photo flow (FR-APP-11 to 14): in-app camera only (no gallery or file picker), a typed
 * reading, device GPS, one submission. The server stamps the time and runs the checks.
 */
export function MeterCapture(props: {
  kind: ReadingKind;
  alertId?: string;
  /** Shown above the camera, e.g. "Before photo". */
  title: string;
  onDone: (reading: MeterReading) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [readingText, setReadingText] = useState('');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsProblem, setGpsProblem] = useState<LocationProblem | null>(null);
  const [locating, setLocating] = useState(false);
  const submit = useSubmitReading();

  if (submit.data)
    return <Submitted reading={submit.data} onDone={() => props.onDone(submit.data)} />;

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <Card title="Camera needed">
        <Text style={styles.body}>
          KapitWatt takes the meter photo with its own camera. Gallery photos are not accepted.
        </Text>
        <Button label="Allow camera" onPress={() => void requestPermission()} />
      </Card>
    );
  }

  if (!photoUri) {
    return (
      <View style={styles.gap}>
        <Text style={styles.title}>{props.title}</Text>
        <Text style={styles.body}>
          Fit the whole meter in the frame: the dial and the serial number.
        </Text>
        <View style={styles.cameraFrame}>
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={() => setReady(true)}
          />
        </View>
        <Button
          label="Take photo"
          disabled={!ready}
          onPress={async () => {
            const pic = await camera.current?.takePictureAsync({ quality: 0.6 });
            if (pic) setPhotoUri(pic.uri);
          }}
        />
      </View>
    );
  }

  const readingKwh = Number(readingText.replace(',', '.'));
  const validReading = readingText.trim() !== '' && Number.isFinite(readingKwh) && readingKwh >= 0;

  const send = async () => {
    setGpsError(null);
    setLocating(true);
    let pos: { lat: number; lng: number };
    try {
      pos = await currentPosition();
      setGpsProblem(null);
    } catch (e) {
      if (e instanceof LocationError) setGpsProblem(e.problem);
      else setGpsError('Could not get your location. Try again near a window.');
      return;
    } finally {
      setLocating(false);
    }
    submit.mutate({
      input: { kind: props.kind, alertId: props.alertId, readingKwh, lat: pos.lat, lng: pos.lng },
      photoUri,
    });
  };

  return (
    <View style={styles.gap}>
      <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
      <TextField
        label="Meter reading (kWh)"
        hint="Type the number on the meter exactly, including the decimal."
        placeholder="e.g. 1204.3"
        keyboardType="decimal-pad"
        value={readingText}
        onChangeText={setReadingText}
      />
      {gpsProblem ? <LocationPrompt problem={gpsProblem} onRetry={send} /> : null}
      {gpsError ? <Text style={styles.error}>{gpsError}</Text> : null}
      {submit.isError ? <Text style={styles.error}>{submitError(submit.error)}</Text> : null}
      <Button
        label="Send reading"
        disabled={!validReading}
        loading={locating || submit.isPending}
        onPress={() => void send()}
      />
      <Button
        label="Retake photo"
        variant="secondary"
        disabled={locating || submit.isPending}
        onPress={() => setPhotoUri(null)}
      />
      <Text style={styles.caption}>You can send each photo only once.</Text>
    </View>
  );
}

function Submitted(props: { reading: MeterReading; onDone: () => void }) {
  const { reading } = props;
  const ok = reading.checkStatus === 'pass';
  return (
    <Card title={ok ? 'Reading accepted' : 'Reading sent for review'}>
      <Text style={styles.body}>{reading.readingKwh.toFixed(1)} kWh received by the server.</Text>
      {ok ? null : (
        <>
          {reading.flags.map((f) => (
            <Text key={f} style={styles.error}>
              {FLAG_TEXT[f]}
            </Text>
          ))}
          <Text style={styles.body}>A Meralco staff member will review it.</Text>
        </>
      )}
      <Button label="Done" onPress={props.onDone} />
    </Card>
  );
}

function submitError(e: Error): string {
  if (e instanceof ApiError) {
    const code = (e.body as { error?: string } | null)?.error;
    if (code === 'deadline_passed') return 'The deadline for this photo has passed.';
    if (code === 'already_submitted') return 'You already sent this photo.';
    if (code === 'no_commitment') return 'Commit a cut before sending photos.';
  }
  return 'Could not send the reading. Check your connection and try again.';
}

const styles = StyleSheet.create({
  gap: { gap: space.md },
  title: { ...text.title, color: colors.ink },
  body: { ...text.body, color: colors.muted },
  caption: { ...text.caption, color: colors.muted },
  error: { ...text.body, color: colors.red },
  cameraFrame: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.navy,
  },
  preview: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.lg },
});
