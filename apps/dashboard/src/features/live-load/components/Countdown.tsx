import { useCountdown, useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { ON, ON_SOFT } from '@/styles/on-brand';

export function Countdown({ label, at }: { label: string; at: number }) {
  const t = useTheme();
  const c = useCountdown(at);
  return (
    <View style={{ alignItems: 'center', gap: t.space[0.5] }} accessibilityLiveRegion="polite">
      <Text variant="labelMedium" style={{ color: ON_SOFT }}>
        {c.done ? 'Due now' : label}
      </Text>
      <Text variant="dataMedium" style={{ color: ON }}>
        {c.label}
      </Text>
    </View>
  );
}
