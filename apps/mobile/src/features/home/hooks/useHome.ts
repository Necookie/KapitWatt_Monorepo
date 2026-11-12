import { useBrownoutRisk } from '@/utils/brownout';
import { greeting } from '@/utils/greeting';
import { startOver } from '@/utils/nav';
import { useActiveAlert, useLogout, useMe, useRefreshAll } from '@/api/queries';
import { firstName } from '../utils/first-name';
import { useNextStep } from './useNextStep';

/** Home's queries, its band (place and greeting), the next step, and the screen's actions. */
export function useHome() {
  const alert = useActiveAlert();
  const me = useMe();
  const refreshAll = useRefreshAll();
  const risk = useBrownoutRisk(alert.data?.alert, me.data?.barangayId);
  const logout = useLogout();

  const name = firstName(me.data?.accountName ?? null);
  // "Magandang gabi, Maria": the greeting for the time of day, without its "!".
  const title = `${greeting().replace(/!$/, '')}${name ? `, ${name}` : ''}`;
  const place = me.data ? `${me.data.barangayName}, ${me.data.municipality}` : undefined;
  const logInAgain = () => logout.mutate(undefined, { onSettled: () => startOver('/welcome') });
  const nextStep = useNextStep(alert.data, me.data);

  return { alert, me, refreshAll, risk, title, place, logInAgain, nextStep };
}
