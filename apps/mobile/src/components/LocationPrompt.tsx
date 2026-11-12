import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { fixLocation, LOCATION_HELP, type LocationProblem } from '@/utils/location';
import { colors, radius, space, text } from '@/styles/theme';

/**
 * Shown when we could not get the phone's location. The button brings back the right system
 * prompt (turn on location, allow permission, or Settings), then `onRetry` tries again. If the
 * prompt sent the user to Settings, it retries automatically when they come back to the app.
 */
export function LocationPrompt(props: { problem: LocationProblem; onRetry: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const leftForSettings = useRef(false);
  const { onRetry } = props;
  const help = LOCATION_HELP[props.problem];

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && leftForSettings.current) {
        leftForSettings.current = false;
        void onRetry();
      }
    });
    return () => sub.remove();
  }, [onRetry]);

  return (
    <View style={styles.box}>
      <Text style={styles.message}>{help.message}</Text>
      <Button
        label={help.button}
        loading={busy}
        onPress={async () => {
          setBusy(true);
          try {
            const outcome = await fixLocation(props.problem);
            if (outcome === 'opened_settings') leftForSettings.current = true;
            else await onRetry();
          } finally {
            setBusy(false);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.red,
    backgroundColor: colors.background,
  },
  message: { ...text.body, color: colors.red },
});
