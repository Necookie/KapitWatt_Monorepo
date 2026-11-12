import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Button, Text } from '@kapitwatt/ui';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

/** No alert yet: say so, and offer the one action that makes one. */
export function NoAlerts() {
  const t = useTheme();
  const router = useRouter();
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
          backgroundColor: t.color.primaryContainer,
        }}
      >
        <Icon name="history" size="lg" color="onPrimaryContainer" />
      </View>
      <View style={{ flex: 1, minWidth: 240, gap: t.space[1] }}>
        <Text variant="headlineSmall">No alert has been sent yet</Text>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          Every alert sent to the pilot is logged here with its sender, time, window and outcome.
        </Text>
      </View>
      <Button
        label="Send alert"
        icon={<Icon name="send" size="sm" color="onPrimary" />}
        onPress={() => router.push('/alerts/new')}
      />
    </View>
  );
}
