import { router } from 'expo-router';
import { useBrownoutRisk } from '@/utils/brownout';
import { greeting } from '@/utils/greeting';
import { startOver } from '@/utils/nav';
import { useActiveAlert, useLogout, useMe, useRefreshAll } from '@/api/queries';
import { firstName } from '../utils/first-name';

/** Home's queries, its band (place and greeting), and the screen's actions. */
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
  const startPractice = () => router.push('/rehearsal');
  const openAlert = (alertId: string) =>
    router.push({ pathname: '/alert/[alertId]', params: { alertId } });

  return { alert, me, refreshAll, risk, title, place, logInAgain, startPractice, openAlert };
}
