import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Button, Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { kw } from '@/utils/format';
import { motion } from '@/styles/motion';

/**
 * While overriding barangay targets: what the shares add up to against the alert's target (or what
 * is wrong with a typed value), with Cancel and Save.
 */
export function TargetEditBar({
  invalid,
  alertTargetKw,
  allTargets,
  saving,
  canSave,
  onCancel,
  onSave,
}: {
  invalid: boolean;
  /** The alert's overall target, kW. */
  alertTargetKw: number;
  /** The barangay targets summed across the alert with the edits applied, kW. */
  allTargets: number;
  saving: boolean;
  canSave: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const t = useTheme();
  const c = t.color;
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: t.space[3],
          padding: t.space[4],
          borderRadius: t.radius.md,
          backgroundColor: invalid ? c.errorContainer : c.secondaryContainer,
        },
        motion.dropIn,
      ]}
    >
      <Icon
        name={invalid ? 'warning' : 'info'}
        size="sm"
        color={invalid ? 'onErrorContainer' : 'onSecondaryContainer'}
      />
      <Text
        variant="bodyMedium"
        color={invalid ? 'onErrorContainer' : 'onSecondaryContainer'}
        style={{ flex: 1, minWidth: 220 }}
      >
        {invalid
          ? 'Enter a target from 0 to 1,000,000 kW for each barangay.'
          : `An override changes that barangay's share only. The alert asks for ${kw(alertTargetKw)} kW in all; the barangay targets would add up to ${kw(Math.round(allTargets * 10) / 10)} kW.`}
      </Text>
      <View style={{ flexDirection: 'row', gap: t.space[2] }}>
        <Button label="Cancel" variant="text" disabled={saving} onPress={onCancel} />
        <Button label="Save targets" loading={saving} disabled={!canSave} onPress={onSave} />
      </View>
    </View>
  );
}
