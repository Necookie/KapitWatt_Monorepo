import { errorMessage, USE_FIXTURES } from '@/api/client';
import { NoticeCard } from './NoticeCard';

/** Why there is nothing (or not everything) to show: fixture mode, a failed request, or no alert yet. */
export function AnalyticsNotice({ failed, noAlert }: { failed: unknown; noAlert: boolean }) {
  return USE_FIXTURES ? (
    <NoticeCard icon="info">
      Analytics need the live API. Fixture mode has no stored history.
    </NoticeCard>
  ) : failed ? (
    <NoticeCard icon="flagged" error>
      {errorMessage(failed)}
    </NoticeCard>
  ) : noAlert ? (
    <NoticeCard icon="info">
      No alert yet. Send one, then come back to see how it performs.
    </NoticeCard>
  ) : null;
}
