import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Button, Text } from '@kapitwatt/ui';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

/** No figures for this town: no alert yet, or the alert does not target it. */
export function TownEmptyState({ name, hasAlert }: { name?: string; hasAlert: boolean }) {
  const t = useTheme();
  const router = useRouter();
  return (
    <View
      style={{
        alignItems: 'center',
        gap: t.space[3],
        paddingVertical: t.space[12],
        paddingHorizontal: t.space[6],
        borderRadius: t.radius.lg,
        backgroundColor: t.color.surfaceContainerLowest,
        borderWidth: t.borderWidth.hairline,
        borderColor: t.color.outlineVariant,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: t.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.color.surfaceContainerHigh,
        }}
      >
        <Icon name="town" color="onSurfaceVariant" />
      </View>
      <Text variant="titleLarge" style={{ textAlign: 'center' }}>
        {hasAlert ? `${name ?? 'This town'} is not in this alert` : 'No alert yet'}
      </Text>
      <Text
        variant="bodyMedium"
        color="onSurfaceVariant"
        style={{ textAlign: 'center', maxWidth: 420 }}
      >
        {hasAlert
          ? 'The current alert targets other towns. Its figures show on Live load.'
          : 'A town’s figures appear here once an alert targets it.'}
      </Text>
      <Button label="Back to Live load" variant="tonal" onPress={() => router.push('/')} />
    </View>
  );
}
