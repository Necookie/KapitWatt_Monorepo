import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, space, text } from '@/theme';
import { Button } from './Button';

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.teal} size="large" />
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
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>{props.message ?? 'Check your connection, then try again.'}</Text>
      {props.onRetry ? (
        <Button label="Try again" variant="secondary" onPress={props.onRetry} />
      ) : null}
      {props.action ? (
        <Button label={props.action.label} variant="secondary" onPress={props.action.onPress} />
      ) : null}
    </View>
  );
}

/** Plain statement of what is simulated or a placeholder (FR-APP-17, NFR-U1). */
export function SimulatedNote(props: { children: string }) {
  return <Text style={styles.note}>{props.children}</Text>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: space.xl,
    gap: space.md,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: { ...text.title, color: colors.ink },
  body: { ...text.body, color: colors.muted },
  note: { ...text.caption, color: colors.muted, fontStyle: 'italic' },
});
