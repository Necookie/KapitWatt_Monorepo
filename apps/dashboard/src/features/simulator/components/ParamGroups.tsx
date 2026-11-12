import type { SimParams } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { View } from 'react-native';
import { HouseholdsGroup } from './HouseholdsGroup';
import { RealismGroup } from './RealismGroup';
import { VerificationGroup } from './VerificationGroup';

/**
 * The simulation's assumptions in three plain groups: who takes part, how cuts are verified, and the
 * realism knobs (collapsed: rarely touched). Each slider marks the plan's default.
 */
export function ParamGroups({
  params,
  set,
}: {
  params: SimParams;
  set: (patch: Partial<SimParams>) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: t.space[4] }}>
      <HouseholdsGroup params={params} set={set} />
      <VerificationGroup params={params} set={set} />
      <RealismGroup params={params} set={set} />
    </View>
  );
}
