import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { Panel } from '@/components/Panel';
import { useLayoutValue } from '@/hooks/useLayoutValue';
import { STEPS } from '../utils/event-steps';

/** The five steps of an event, so the operator knows what this page will show. */
export function EventSteps() {
  const t = useTheme();
  const [wide, onLayout] = useLayoutValue((w) => w >= 600);
  return (
    <Panel
      title="How an event runs"
      subtitle="What this page follows once you send an alert."
      style={{ flex: 1 }}
    >
      <View
        onLayout={onLayout}
        style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? t.space[3] : t.space[4] }}
      >
        {STEPS.map((step, i) => (
          <View
            key={step.title}
            style={{
              flex: wide ? 1 : undefined,
              flexDirection: wide ? 'column' : 'row',
              gap: t.space[3],
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: i === 0 ? t.color.primary : t.color.primaryContainer,
                }}
              >
                <Icon
                  name={step.icon}
                  size="md"
                  color={i === 0 ? 'onPrimary' : 'onPrimaryContainer'}
                />
              </View>
              {wide && i < STEPS.length - 1 ? (
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    marginLeft: t.space[3],
                    backgroundColor: t.color.outlineVariant,
                  }}
                />
              ) : null}
            </View>
            <View style={{ flex: wide ? undefined : 1, gap: t.space[1], paddingRight: t.space[2] }}>
              <Text variant="titleMedium">
                {i + 1}. {step.title}
              </Text>
              <Text variant={wide ? 'bodySmall' : 'bodyMedium'} color="onSurfaceVariant">
                {step.body}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Panel>
  );
}
