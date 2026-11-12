import { StyleSheet, Text, View } from 'react-native';
import { formatDuration } from '@/utils/format';
import { useServerNow } from '@/utils/server-time';
import { colors, text } from '@/styles/theme';

/** Counts down to `at` on the server clock. */
export function Countdown(props: { label: string; at: string }) {
  const now = useServerNow();
  return (
    <View>
      <Text style={styles.label}>{props.label}</Text>
      <Text style={styles.figure}>{formatDuration(new Date(props.at).getTime() - now)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...text.body, color: colors.muted },
  figure: { ...text.figure, color: colors.ink },
});
