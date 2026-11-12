import type { AlertLevel } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Chip, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { Notice } from '@/components/ui/Notice';
import { SendButton } from './SendButton';
import { SummaryRow } from './SummaryRow';

/** What goes out, then the one action. */
export function SendSummary({
  level,
  rows,
  problem,
  onSend,
}: {
  level: AlertLevel;
  rows: { label: string; value: string }[];
  problem: string | null;
  onSend: () => void;
}) {
  const t = useTheme();
  const red = level === 'red';
  return (
    <View
      style={{
        gap: t.space[4],
        padding: t.space[5],
        borderRadius: t.radius.lg,
        backgroundColor: t.color.surfaceContainerLowest,
        borderWidth: t.borderWidth.hairline,
        borderColor: t.color.outlineVariant,
      }}
    >
      <Text variant="titleMedium">Summary</Text>
      <View style={{ gap: t.space[3] }}>
        <SummaryRow label="Level">
          <Chip
            label={red ? 'Red alert' : 'Yellow alert'}
            tone={red ? 'alertRed' : 'alertYellow'}
            icon={
              <Icon
                name="alert"
                weight="fill"
                size="sm"
                color={red ? 'onAlertRedContainer' : 'onAlertYellowContainer'}
              />
            }
          />
        </SummaryRow>
        {rows.map((r) => (
          <SummaryRow key={r.label} label={r.label}>
            <Text variant="bodyMedium" style={{ fontVariant: ['tabular-nums'] }}>
              {r.value}
            </Text>
          </SummaryRow>
        ))}
      </View>
      {problem ? <Notice tone="warning">{problem}</Notice> : null}
      <SendButton
        level={level}
        label={`Review and send ${red ? 'red' : 'yellow'} alert`}
        disabled={problem !== null}
        onPress={onSend}
      />
      <Text variant="bodySmall" color="onSurfaceVariant">
        The NGCP alert is simulated: the operator plays Meralco. Every alert is logged with sender
        and time.
      </Text>
    </View>
  );
}
