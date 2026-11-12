import { router } from 'expo-router';
import type { NowAction } from '@/utils/event-steps';

/** Opens the screen for the one thing to do now: commit, practice, a meter photo or the result. */
export function openEventAction(alertId: string, kind: NowAction) {
  if (kind === 'rehearsal') router.push('/rehearsal');
  else if (kind === 'commit')
    router.push({ pathname: '/alert/[alertId]/commit', params: { alertId } });
  else if (kind === 'result')
    router.push({ pathname: '/alert/[alertId]/result', params: { alertId } });
  else router.push({ pathname: '/alert/[alertId]/capture', params: { alertId, kind } });
}
