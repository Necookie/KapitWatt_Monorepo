import { Icon } from '@kapitwatt/icons';
import type { MeterReading, ReadingFlag, ReadingKind } from '@kapitwatt/shared';
import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationPrompt } from '@/components/LocationPrompt';
import { MascotHeader } from '@/components/mascot/MascotHeader';
import { Button } from '@/components/ui';
import { describeError } from '@/api/http';
import { currentPosition, LocationError, type LocationProblem } from '@/utils/location';
import { useSubmitReading } from '@/api/queries';
import { fonts, radius, space } from '@/styles/theme';

const c = themes.light.color;

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
 * Meter photo flow (FR-APP-11 to 14; mockups "Meter photo · camera" and "· reading"): in-app
 * camera only (no gallery or file picker), a typed reading, device GPS, one submission. The
 * server stamps the time and runs the checks. Full screen: the host route hides its header.
 */
export function MeterCapture(props: {
  kind: ReadingKind;
  alertId?: string;
  /** Shown in the top bar, e.g. "Before photo". */
  title: string;
  /** Under the title on the camera, e.g. "Due 6:15 PM". */
  subtitle?: string;
  onDone: (reading: MeterReading) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [readingText, setReadingText] = useState('');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsProblem, setGpsProblem] = useState<LocationProblem | null>(null);
  const [locating, setLocating] = useState(false);
  const submit = useSubmitReading();
  const pad = { paddingTop: insets.top, paddingBottom: insets.bottom };

  if (submit.data) {
    return (
      <View style={[styles.light, pad]}>
        <Submitted reading={submit.data} onDone={() => props.onDone(submit.data)} />
      </View>
    );
  }

  if (!permission) return <View style={styles.dark} />;
  if (!permission.granted) {
    return (
      <View style={[styles.light, pad]}>
        <TopBar title={props.title} onBack={props.onClose} icon="close" />
        <View style={styles.body}>
          <MascotHeader label="Camera needed" line="KapitWatt takes the meter photo itself." />
          <Text color="onSurfaceVariant">Photos from your gallery are not accepted.</Text>
          <View style={styles.bottom}>
            <Button label="Allow camera" onPress={() => void requestPermission()} />
          </View>
        </View>
      </View>
    );
  }

  if (!photoUri) {
    return (
      <View style={[styles.dark, pad]}>
        <View style={styles.cameraBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            onPress={props.onClose}
            style={styles.iconButton}
          >
            <Icon name="close" color="#FFFFFF" />
          </Pressable>
          <View style={styles.cameraTitle}>
            <Text variant="titleMedium" style={styles.onDark}>
              {props.title}
            </Text>
            {props.subtitle ? (
              <Text variant="bodyMedium" style={styles.onDarkMuted}>
                {props.subtitle}
              </Text>
            ) : null}
          </View>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.viewfinder}>
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={() => setReady(true)}
          />
          <View style={styles.frame} pointerEvents="none">
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.hint} pointerEvents="none">
            <Text variant="bodyMedium" style={styles.onDark}>
              Fit the numbers and the serial in the frame
            </Text>
          </View>
        </View>

        <View style={styles.shutterRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            accessibilityState={{ disabled: !ready }}
            disabled={!ready}
            onPress={async () => {
              const pic = await camera.current?.takePictureAsync({ quality: 0.6 });
              if (pic) setPhotoUri(pic.uri);
            }}
            style={({ pressed }) => [styles.shutter, (!ready || pressed) && styles.shutterDim]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </View>
    );
  }

  const readingKwh = Number(readingText.replace(',', '.'));
  const validReading = readingText.trim() !== '' && Number.isFinite(readingKwh) && readingKwh >= 0;
  const busy = locating || submit.isPending;

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
    <View style={[styles.light, pad]}>
      <TopBar title={props.title} onBack={() => setPhotoUri(null)} icon="back" disabled={busy} />
      <View style={styles.body}>
        <View style={styles.photoCard}>
          <Image source={{ uri: photoUri }} style={styles.thumb} resizeMode="cover" />
          <View style={styles.flex}>
            <Text variant="titleMedium">Photo taken</Text>
            <Text variant="bodyMedium" color="onSurfaceVariant">
              Make sure the numbers are sharp.
            </Text>
            <Button
              label="Retake"
              variant="text"
              disabled={busy}
              onPress={() => setPhotoUri(null)}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text variant="labelLarge" color="onSurfaceVariant">
            Reading on the meter
          </Text>
          <View style={styles.readingFrame}>
            <TextInput
              accessibilityLabel="Reading on the meter, in kWh"
              keyboardType="decimal-pad"
              placeholder="1204.3"
              placeholderTextColor={c.outline}
              value={readingText}
              onChangeText={setReadingText}
              style={styles.readingInput}
              autoFocus
            />
            <Text variant="titleLarge" color="onSurfaceVariant">
              kWh
            </Text>
          </View>
          <Text variant="bodyMedium" color="onSurfaceVariant">
            Type every digit, including the decimal.
          </Text>
        </View>

        <View style={styles.note}>
          <Icon name="info" size="sm" color="onPrimaryContainer" />
          <Text variant="bodyMedium" style={{ color: c.onPrimaryContainer }}>
            You can send this photo only once.
          </Text>
        </View>

        {gpsProblem ? <LocationPrompt problem={gpsProblem} onRetry={send} /> : null}
        {gpsError ? <Text color="error">{gpsError}</Text> : null}
        {submit.isError ? <Text color="error">{submitError(submit.error)}</Text> : null}

        <View style={styles.bottom}>
          <Button
            label="Send reading"
            disabled={!validReading}
            loading={busy}
            onPress={() => void send()}
          />
        </View>
      </View>
    </View>
  );
}

/** Light top bar: back or close on the left, the step's name beside it. */
function TopBar(props: {
  title: string;
  onBack: () => void;
  icon: 'back' | 'close';
  disabled?: boolean;
}) {
  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={props.icon === 'close' ? 'Close' : 'Back to the camera'}
        disabled={props.disabled}
        onPress={props.onBack}
        style={styles.iconButton}
      >
        <Icon name={props.icon} />
      </Pressable>
      <Text variant="titleMedium">{props.title}</Text>
    </View>
  );
}

function Submitted(props: { reading: MeterReading; onDone: () => void }) {
  const { reading } = props;
  const ok = reading.checkStatus === 'pass';
  return (
    <View style={styles.body}>
      <MascotHeader
        label={ok ? 'Reading accepted' : 'Sent for review'}
        line={
          ok
            ? `${reading.readingKwh.toFixed(1)} kWh received. Nice!`
            : 'A Meralco staff member will check it.'
        }
        pose={ok ? 'reward' : 'neutral'}
        tone={ok ? 'reward' : 'primary'}
      />
      {ok
        ? null
        : reading.flags.map((f) => (
            <Text key={f} color="error">
              {FLAG_TEXT[f]}
            </Text>
          ))}
      <View style={styles.bottom}>
        <Button label="Done" onPress={props.onDone} />
      </View>
    </View>
  );
}

const SUBMIT_REFUSALS: Record<string, string> = {
  deadline_passed: 'The deadline for this photo has passed.',
  not_open_yet: 'It is too early for this photo. Wait for the time shown on the event screen.',
  already_submitted: 'You already sent this photo.',
  already_rehearsed: 'Your practice run is already complete.',
  no_commitment: 'Commit a cut before sending photos.',
  duplicate_photo: 'This photo was already used. Take a new one.',
  invalid_photo: 'That photo could not be read. Take it again with the in-app camera.',
  photo_too_large: 'The photo is too large. Take it again.',
};

/** Other refusals (for example the wait between practice photos) show the server's own sentence. */
function submitError(e: Error): string {
  return describeError(e, SUBMIT_REFUSALS, 'Could not send the reading. Try again.');
}

const DARK = c.onSurface;
const CORNER = 44;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dark: { flex: 1, backgroundColor: DARK },
  light: { flex: 1, backgroundColor: c.surface },
  onDark: { color: '#FFFFFF' },
  onDarkMuted: { color: c.outlineVariant },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBar: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  cameraTitle: { flex: 1, alignItems: 'center' },
  viewfinder: {
    flex: 1,
    marginHorizontal: space.lg,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: { width: '78%', aspectRatio: 3 / 4 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#FFFFFF' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 20 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 20 },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 20,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 20,
  },
  hint: {
    position: 'absolute',
    bottom: space.lg,
    paddingHorizontal: 14,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  shutterRow: { height: 140, alignItems: 'center', justifyContent: 'center' },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    padding: 4,
  },
  shutterDim: { opacity: 0.6 },
  shutterInner: { flex: 1, borderRadius: 32, backgroundColor: '#FFFFFF' },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  body: {
    flex: 1,
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.xl,
    gap: space.xl,
  },
  bottom: { marginTop: 'auto' },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: c.surfaceContainerLow,
  },
  thumb: {
    width: 84,
    height: 108,
    borderRadius: radius.md,
    backgroundColor: c.surfaceContainerHigh,
  },
  field: { gap: 6 },
  readingFrame: {
    height: 72,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: c.primary,
    backgroundColor: c.surfaceContainerLowest,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: space.lg,
    gap: space.sm,
  },
  readingInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.semibold,
    fontSize: 32,
    color: c.onSurface,
    fontVariant: ['tabular-nums'],
    paddingVertical: 0,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: c.primaryContainer,
  },
});
