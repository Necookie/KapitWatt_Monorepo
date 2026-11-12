import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';

/** Nothing waiting: say so plainly, and what will appear here. */
export function AllClear({ loading }: { loading: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: t.space[5],
        padding: t.space[6],
        borderRadius: t.radius.lg,
        backgroundColor: t.color.surfaceContainerLowest,
        borderWidth: t.borderWidth.hairline,
        borderColor: t.color.outlineVariant,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.color.reliefContainer,
        }}
      >
        <Icon name="verified" size="lg" weight="fill" color="onReliefContainer" />
      </View>
      <View style={{ flex: 1, minWidth: 240, gap: t.space[1] }}>
        <Text variant="headlineSmall">
          {loading ? 'Checking for flagged readings' : 'Nothing waiting'}
        </Text>
        <Text variant="bodyMedium" color="onSurfaceVariant" style={{ maxWidth: 620 }}>
          Every meter photo reading has passed its checks. When one fails a rule (a late photo, a
          serial that does not match, a reading that does not add up), it waits here for a person to
          approve or reject.
        </Text>
      </View>
    </View>
  );
}
