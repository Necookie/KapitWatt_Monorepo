import type { AlertLevel } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { ChoiceChip } from '@/components/ChoiceChip';
import { LEVELS, STAGES, type Stage } from '../utils/filters';

/** Level chips, stage chips (tap a selected stage again to clear it), and the shown count. */
export function LogFilters({
  level,
  onLevel,
  stage,
  onStage,
  shown,
  total,
}: {
  level: AlertLevel | 'all';
  onLevel: (level: AlertLevel | 'all') => void;
  stage: Stage;
  onStage: (stage: Stage) => void;
  shown: number;
  total: number;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: t.space[2],
      }}
    >
      {LEVELS.map((l) => (
        <ChoiceChip
          key={l.value}
          label={l.label}
          accessibilityLabel={`Level: ${l.label}`}
          selected={level === l.value}
          onPress={() => onLevel(l.value)}
        />
      ))}
      <View
        style={{
          width: 1,
          height: 20,
          marginHorizontal: t.space[1],
          backgroundColor: t.color.outlineVariant,
        }}
      />
      {STAGES.map((s) => (
        <ChoiceChip
          key={s.value}
          label={s.label}
          selected={stage === s.value}
          onPress={() => onStage(stage === s.value ? 'all' : s.value)}
        />
      ))}
      <Text variant="bodySmall" color="onSurfaceVariant" style={{ marginLeft: 'auto' }}>
        {shown} of {total} alerts · latest 100
      </Text>
    </View>
  );
}
