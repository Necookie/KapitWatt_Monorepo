import { memo } from 'react';
import type { AlertStatus } from '@kapitwatt/shared';
import { useTheme } from '@kapitwatt/hooks';
import { Icon } from '@kapitwatt/icons';
import { Button, Chip } from '@kapitwatt/ui';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import type { DashboardAlert } from '@/api/client';
import { StageControl } from './StageControl';

/** Demo only: the stage buttons in their own dashed strip, so nobody mistakes them for operations. */
export const DemoStrip = memo(function DemoStrip({
  alert,
  status,
}: {
  alert: DashboardAlert;
  status: AlertStatus;
}) {
  const t = useTheme();
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: t.space[4],
        paddingHorizontal: t.space[4],
        paddingVertical: t.space[3],
        borderRadius: t.radius.lg,
        borderWidth: t.borderWidth.hairline,
        borderStyle: 'dashed',
        borderColor: t.color.simulated,
        backgroundColor: t.color.surfaceContainerLow,
      }}
    >
      <Chip
        label="Simulated"
        tone="simulated"
        icon={<Icon name="simulated" size="sm" color="simulated" />}
      />
      <View style={{ flex: 1, minWidth: 280 }}>
        <StageControl alert={alert} status={status} stepper={false} />
      </View>
      <Button label="Simulator" variant="text" onPress={() => router.push('/simulator')} />
    </View>
  );
});
