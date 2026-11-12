import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { StyleSheet, View } from 'react-native';
import { fontFamily, space } from '@kapitwatt/tokens';

const c = themes.light.color;

export function Line(props: { label: string; value: string; note?: string; last?: boolean }) {
  return (
    <View style={[styles.line, !props.last && styles.divider]}>
      <View style={styles.flex}>
        <Text color="onSurfaceVariant">{props.label}</Text>
        {props.note ? (
          <Text variant="bodySmall" color="relief" style={styles.strong}>
            {props.note}
          </Text>
        ) : null}
      </View>
      <Text style={styles.tabular}>{props.value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  strong: { fontFamily: fontFamily.semibold },
  tabular: { fontVariant: ['tabular-nums'] },
  line: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[3] },
  divider: { borderBottomWidth: 1, borderBottomColor: c.outlineVariant },
});
