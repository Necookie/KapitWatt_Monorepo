import type { FlaggedReading } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { dayAndClock, reading } from '@/utils/format';
import { FLAG_LABEL, KIND_LABEL, flagHelp } from '../utils/checks';
import { DecisionButton } from './DecisionButton';
import { Fact } from './Fact';
import { MeterPhoto } from './MeterPhoto';
import { motion } from '@/styles/motion';

/** The selected reading: photo, what the household typed, each failed check explained, decision. */
export function ReviewPane({
  reading: r,
  deciding,
  disabled,
  onDecide,
}: {
  reading: FlaggedReading;
  deciding: 'approve' | 'reject' | null;
  disabled: boolean;
  onDecide: (decision: 'approve' | 'reject') => void;
}) {
  const t = useTheme();
  const c = t.color;
  const delta = r.previousKwh === null ? null : r.readingKwh - r.previousKwh;
  return (
    <View style={[{ gap: t.space[4] }, motion.fadeIn]}>
      <View style={{ gap: t.space[0.5] }}>
        <Text variant="titleLarge">
          {r.barangayName}, {r.municipality}
        </Text>
        <Text variant="bodyMedium" color="onSurfaceVariant">
          {KIND_LABEL[r.kind]} photo · captured {dayAndClock(r.capturedAt)}
        </Text>
      </View>

      <MeterPhoto reading={r} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
        <Fact label="Registered serial" value={r.meterSerial} />
        <Fact
          label="Typed reading"
          value={`${reading(r.readingKwh)} kWh`}
          note={
            delta === null
              ? 'No previous reading'
              : `${delta >= 0 ? '+' : '−'}${reading(Math.abs(delta))} kWh since ${reading(r.previousKwh as number)}`
          }
        />
      </View>

      <View style={{ gap: t.space[2] }}>
        {r.flags.map((flag) => (
          <View
            key={flag}
            style={{
              flexDirection: 'row',
              gap: t.space[3],
              padding: t.space[3],
              borderRadius: t.radius.md,
              backgroundColor: c.alertYellowContainer,
            }}
          >
            <Icon name="flagged" size="sm" color="onAlertYellowContainer" />
            <View style={{ flex: 1, gap: t.space[0.5] }}>
              <Text variant="titleSmall" color="onAlertYellowContainer">
                {FLAG_LABEL[flag]}
              </Text>
              <Text variant="bodySmall" color="onAlertYellowContainer">
                {flagHelp(flag, r)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: t.space[3],
          paddingTop: t.space[4],
          borderTopWidth: t.borderWidth.hairline,
          borderTopColor: c.outlineVariant,
        }}
      >
        <DecisionButton
          label="Approve"
          hint="A"
          icon="check"
          tone="approve"
          busy={deciding === 'approve'}
          disabled={disabled}
          onPress={() => onDecide('approve')}
        />
        <DecisionButton
          label="Reject"
          hint="R"
          icon="close"
          tone="reject"
          busy={deciding === 'reject'}
          disabled={disabled}
          onPress={() => onDecide('reject')}
        />
        <Text variant="bodySmall" color="onSurfaceVariant" style={{ flex: 1, minWidth: 220 }}>
          An approved cut counts in full toward its barangay. A rejected one earns nothing and
          cannot be resubmitted. The next reading opens after you decide.
        </Text>
      </View>
    </View>
  );
}
