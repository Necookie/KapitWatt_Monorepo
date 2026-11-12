import { POLL_INTERVAL_MS } from '@kapitwatt/shared';
import { AlertStatusTag } from '@/components/AlertStatusTag';
import { DataTable, type Column } from '@/components/DataTable';
import { Card, Notice, PageHeader, Tag, Txt } from '@/components/ui';
import { errorMessage, type DashboardAlert } from '@/lib/client';
import { clock, dayAndClock, power } from '@/lib/format';
import { useAlertLog, useBarangays } from '@/lib/queries';

/** FR-DASH-13: every alert with sender, time, level, window and targets, newest first. */
export default function AlertLogScreen() {
  const log = useAlertLog();
  const barangays = useBarangays();

  const townOf = new Map((barangays.data ?? []).map((b) => [b.id, b.municipality]));
  const pilotSize = barangays.data?.length ?? 0;

  /** "All pilot areas", "3 barangays in Santa Cruz" or "5 barangays in 2 towns". */
  const reach = (alert: DashboardAlert): string => {
    const n = alert.targetBarangayIds.length;
    if (pilotSize > 0 && n === pilotSize) return `All pilot areas (${n} barangays)`;
    const towns = [...new Set(alert.targetBarangayIds.map((id) => townOf.get(id)))].filter(
      (town): town is string => town !== undefined,
    );
    const what = `${n} ${n === 1 ? 'barangay' : 'barangays'}`;
    if (towns.length === 0) return what;
    return towns.length === 1 ? `${what} in ${towns[0]}` : `${what} in ${towns.length} towns`;
  };

  const columns: Column<DashboardAlert>[] = [
    {
      key: 'sent',
      header: 'Sent',
      width: 130,
      render: (a) => (
        <Txt tone="ink" weight="600" numeric>
          {dayAndClock(a.createdAt)}
        </Txt>
      ),
    },
    { key: 'sender', header: 'Sender', width: 110, render: (a) => <Txt>{a.createdBy}</Txt> },
    {
      key: 'level',
      header: 'Level',
      width: 100,
      render: (a) => (
        <Tag
          label={a.level === 'red' ? 'Red alert' : 'Yellow alert'}
          tone={a.level === 'red' ? 'critical' : 'warning'}
        />
      ),
    },
    {
      key: 'window',
      header: 'Peak window',
      width: 180,
      render: (a) => (
        <Txt numeric>
          {dayAndClock(a.windowStart)} to {clock(a.windowEnd)}
        </Txt>
      ),
    },
    { key: 'targets', header: 'Targets', flex: 1.8, render: (a) => <Txt>{reach(a)}</Txt> },
    {
      key: 'targetKw',
      header: 'Target',
      width: 80,
      align: 'right',
      render: (a) => <Txt numeric>{power(a.targetKw)}</Txt>,
    },
    {
      key: 'message',
      header: 'Message',
      flex: 1.6,
      render: (a) => (
        <Txt size="sm" tone="muted" numberOfLines={1}>
          {a.message}
        </Txt>
      ),
    },
    {
      key: 'push',
      header: 'Push',
      width: 80,
      render: (a) =>
        a.pushSentAt ? <Txt numeric>{clock(a.pushSentAt)}</Txt> : <Txt tone="faint">Not sent</Txt>,
    },
    {
      key: 'status',
      header: 'Status',
      width: 110,
      render: (a) => <AlertStatusTag status={a.status} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Alert log"
        subtitle={`The latest 100 alerts sent to the Laguna pilot, newest first. Refreshes every ${POLL_INTERVAL_MS / 1000} seconds.`}
      />
      {log.error ? <Notice tone="critical">{errorMessage(log.error)}</Notice> : null}
      <Card padded={false}>
        <DataTable
          columns={columns}
          rows={log.data ?? []}
          rowKey={(a) => a.id}
          empty="No alert has been sent yet."
          loading={log.isLoading}
        />
      </Card>
      <Txt size="xs" tone="muted">
        The NGCP alert is simulated: the operator plays Meralco. Push goes only to opted-in phones
        in the targeted barangays; simulated households receive nothing.
      </Txt>
    </>
  );
}
