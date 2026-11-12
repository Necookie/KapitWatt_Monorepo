import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { motion, transition } from '@/styles/motion';

export type StepState = 'done' | 'now' | 'todo';

export function Step({
  n,
  title,
  note,
  state,
  action,
}: {
  n: number;
  title: string;
  note: string;
  state: StepState;
  action?: React.ReactNode;
}) {
  const t = useTheme();
  const c = t.color;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.space[3] }}>
      <View
        style={[
          {
            width: 26,
            height: 26,
            borderRadius: 13,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor:
              state === 'done' ? c.relief : state === 'now' ? c.primary : 'transparent',
            borderWidth: state === 'todo' ? 1.5 : 0,
            borderColor: c.outline,
          },
          transition('background-color'),
        ]}
      >
        {state === 'done' ? (
          <View style={motion.pop}>
            <Icon name="check" weight="bold" size="sm" color="onRelief" />
          </View>
        ) : (
          <Text variant="labelMedium" color={state === 'now' ? 'onPrimary' : 'onSurfaceVariant'}>
            {n}
          </Text>
        )}
      </View>
      <View style={{ flex: 1, gap: t.space[0.5] }}>
        <Text variant="titleSmall" color={state === 'todo' ? 'onSurfaceVariant' : 'onSurface'}>
          {title}
        </Text>
        <Text variant="bodySmall" color="onSurfaceVariant">
          {note}
        </Text>
      </View>
      {action}
    </View>
  );
}
