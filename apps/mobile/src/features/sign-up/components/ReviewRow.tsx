import { themes } from '@kapitwatt/styles';
import { Text } from '@kapitwatt/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, space } from '@kapitwatt/tokens';

const c = themes.light.color;

export function ReviewRow(props: {
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  updateButton: {
    height: 48,
    paddingHorizontal: space[3],
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
  },
  reviewDivider: { borderBottomWidth: 1, borderBottomColor: c.outlineVariant },
});
