import { Button, SimulatedNote } from '@/components/ui';
import { USE_MOCKS } from '@/lib/config';
import { router } from 'expo-router';
import { mockFastForward, mockResetAll } from '@/lib/mock';
import { useRefreshAll } from '@/lib/queries';

/**
 * Mock mode only: step the fake event forward, standing in for the operator's
 * "Measure (fast-forward)" on the dashboard. Renders nothing once USE_MOCKS is off.
 */
export function MockControls() {
  const refreshAll = useRefreshAll();
  if (!USE_MOCKS) return null;
  return (
    <>
      <Button
        label="Mock: skip to next phase"
        variant="demo"
        onPress={() => {
          mockFastForward();
          void refreshAll();
        }}
      />
      <Button
        label="Mock: reset (back to sign-up)"
        variant="secondary"
        onPress={() => {
          mockResetAll();
          void refreshAll();
          router.replace('/');
        }}
      />
      <SimulatedNote>
        Mock data, not the API. Turn off USE_MOCKS in src/lib/config.ts.
      </SimulatedNote>
    </>
  );
}
