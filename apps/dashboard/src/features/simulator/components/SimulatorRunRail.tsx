import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import type { SimulatorState } from '../hooks/useSimulatorState';
import { RunRail } from './RunRail';

/** The run rail wired to the simulator's state, its actions and the routes it hands off to. */
export function SimulatorRunRail({
  sim,
  paceSeconds,
  between,
}: {
  sim: SimulatorState;
  paceSeconds: number;
  between: ReactNode;
}) {
  const router = useRouter();
  const { alert, seed, run, reset } = sim;
  return (
    <RunRail
      enabled={sim.demo}
      seeded={sim.households}
      hasAlert={sim.live}
      canRun={sim.canRun}
      committed={sim.committed}
      committedKw={sim.committedKw}
      expectedKw={sim.expected.committedKw}
      paceSeconds={paceSeconds}
      lastRun={run.data ?? null}
      seeding={seed.isPending}
      running={run.isPending}
      resetting={reset.isPending}
      onSeed={() => seed.mutate(undefined)}
      onRun={() => alert.data && run.mutate(alert.data.id)}
      onReset={() => reset.mutate(undefined)}
      onSendAlert={() => router.push('/alerts/new')}
      onOpenLive={() => router.push('/')}
      between={between}
    />
  );
}
