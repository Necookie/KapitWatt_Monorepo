import { StyleSheet, Text, View } from 'react-native';
import { formatDuration } from '@/lib/format';
import { useServerNow } from '@/lib/serverTime';
import { colors, text } from '@/theme';

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
