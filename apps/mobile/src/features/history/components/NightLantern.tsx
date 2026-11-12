import { Lantern } from '@/components/night/Lantern';
import type { NightState } from '../utils/night-state';

const STATE = { verified: 'lit', waiting: 'faint', unpaid: 'unlit' } as const;

/**
 * One past night as a lantern: lit (verified), pale (waiting for results) or an unlit outline
 * (paid nothing). Decorative: the row or summary beside it says the state in words.
 */
export function NightLantern({
  state,
  size,
  ink,
}: {
  state: NightState;
  size: number;
  ink: string;
}) {
  return <Lantern height={size} state={STATE[state]} ink={ink} />;
}
