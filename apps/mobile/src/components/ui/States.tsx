import { Button, Text } from '@kapitwatt/ui';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { space } from '@kapitwatt/tokens';
import { themes } from '@kapitwatt/styles';

const c = themes.light.color;

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={c.primary} size="large" />
    </View>
  );
}

export function ErrorState(props: {
  message?: string;
  onRetry?: () => void;
  /** A second way out, for when trying again cannot help (for example: log in again). */
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.center}>
      <Text variant="titleLarge" style={styles.title}>
        Something went wrong
      </Text>
      <Text variant="bodyLarge" style={styles.body}>
        {props.message ?? 'Check your connection, then try again.'}
      </Text>
      {props.onRetry ? (
        <Button variant="outlined" size="lg" fullWidth label="Try again" onPress={props.onRetry} />
      ) : null}
      {props.action ? (
        <Button
          variant="outlined"
          size="lg"
          fullWidth
          label={props.action.label}
          onPress={props.action.onPress}
        />
      ) : null}
    </View>
  );
}

/** Plain statement of what is simulated or a placeholder (FR-APP-17, NFR-U1). */
export function SimulatedNote(props: { children: string }) {
  return (
    <Text variant="bodyMedium" style={styles.note}>
      {props.children}
    </Text>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: space[6],
    gap: space[3],
    justifyContent: 'center',
    backgroundColor: c.surface,
  },
  title: { color: c.onSurface },
  body: { color: c.onSurfaceVariant },
  note: { color: c.onSurfaceVariant, fontStyle: 'italic' },
});
