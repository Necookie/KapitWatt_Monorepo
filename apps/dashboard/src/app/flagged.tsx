import type { FlaggedReading, ReadingFlag, ReadingKind } from '@kapitwatt/shared';
import { View } from 'react-native';
import { DataTable, type Column } from '@/components/DataTable';
import { Button, Card, Notice, PageHeader, Tag, Txt } from '@/components/ui';
import { FIXTURE_FLAGGED_SHARE, USE_FIXTURES, client, errorMessage } from '@/lib/client';
import { dayAndClock, fraction, reading } from '@/lib/format';
import { useAction, useFlagged } from '@/lib/queries';

/** Why a reading was held, in plain words. OCR only ever flags; it never rejects. */
const FLAG_LABEL: Record<ReadingFlag, string> = {
  late: 'Late photo',
  serial_mismatch: 'Serial does not match',
  too_far: 'Too far from address',
  not_increasing: 'Not higher than last reading',
  implausible_draw: 'More than the service could draw',
  duplicate_photo: 'Reused photo',
  ocr_mismatch: 'OCR differs from typed reading',
};

const KIND_LABEL: Record<ReadingKind, string> = {
  rehearsal: 'Rehearsal',
  before: 'Before',
  after: 'After',
};

/**
 * FR-DASH-11: readings that failed a rule check, for a person to approve or reject.
 * The checks are plain rules; this screen is the human step behind them.
 */
export default function FlaggedScreen() {
  const flagged = useFlagged();
  const review = useAction((input: { id: string; decision: 'approve' | 'reject' }) =>
    client.reviewReading(input.id, input.decision),
  );
  const rows = flagged.data ?? [];
  const deciding = (r: FlaggedReading, decision: 'approve' | 'reject') =>
    review.isPending && review.variables?.id === r.id && review.variables.decision === decision;

  const columns: Column<FlaggedReading>[] = [
    {
      key: 'captured',
      header: 'Captured',
      width: 130,
      render: (r) => (
        <Txt tone="ink" weight="600" numeric>
          {dayAndClock(r.capturedAt)}
        </Txt>
      ),
    },
    {
      key: 'barangay',
      header: 'Barangay',
      flex: 1.2,
      render: (r) => (
        <Txt>
          {r.barangayName}
          <Txt tone="muted">, {r.municipality}</Txt>
        </Txt>
      ),
    },
    {
      key: 'serial',
      header: 'Meter serial',
      width: 130,
      render: (r) => <Txt numeric>{r.meterSerial}</Txt>,
    },
    {
      key: 'kind',
      header: 'Photo',
      width: 90,
      render: (r) => (
        <View style={{ gap: 2 }}>
          <Txt>{KIND_LABEL[r.kind]}</Txt>
          <Txt size="xs" tone={r.hasPhoto ? 'muted' : 'faint'}>
            {r.hasPhoto ? 'Photo on file' : 'No photo'}
          </Txt>
        </View>
      ),
    },
    {
      key: 'reading',
      header: 'Typed kWh',
      width: 96,
      align: 'right',
      render: (r) => (
        <Txt tone="ink" weight="600" numeric>
          {reading(r.readingKwh)}
        </Txt>
      ),
    },
    {
      key: 'previous',
      header: 'Previous kWh',
      width: 104,
      align: 'right',
      render: (r) => <Txt numeric>{r.previousKwh === null ? '—' : reading(r.previousKwh)}</Txt>,
    },
    {
      key: 'change',
      header: 'Change',
      width: 80,
      align: 'right',
      render: (r) => (
        <Txt numeric>
          {r.previousKwh === null
            ? '—'
            : `${r.readingKwh >= r.previousKwh ? '+' : '−'}${reading(
                Math.abs(r.readingKwh - r.previousKwh),
              )}`}
        </Txt>
      ),
    },
    {
      key: 'flags',
      header: 'Failed check',
      flex: 1.6,
      render: (r) => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {r.flags.map((flag) => (
            <Tag key={flag} tone="warning" label={FLAG_LABEL[flag]} />
          ))}
        </View>
      ),
    },
    {
      key: 'decide',
      header: 'Decision',
      width: 170,
      render: (r) => (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Button
            small
            kind="primary"
            label="Approve"
            busy={deciding(r, 'approve')}
            disabled={review.isPending}
            onPress={() => review.mutate({ id: r.id, decision: 'approve' })}
          />
          <Button
            small
            label="Reject"
            busy={deciding(r, 'reject')}
            disabled={review.isPending}
            onPress={() => review.mutate({ id: r.id, decision: 'reject' })}
          />
        </View>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Flagged readings"
        subtitle="Meter photo readings that failed a rule check. A person approves or rejects each one."
        actions={
          flagged.data ? (
            <Tag
              label={rows.length === 0 ? 'Nothing waiting' : `${rows.length} waiting`}
              tone={rows.length === 0 ? 'good' : 'warning'}
            />
          ) : undefined
        }
      />

      {flagged.error ? <Notice tone="critical">{errorMessage(flagged.error)}</Notice> : null}
      {review.error ? <Notice tone="critical">{errorMessage(review.error)}</Notice> : null}
      {USE_FIXTURES ? (
        <Notice tone="brand">
          Fixture data: the in-browser backend runs no photo checks, so it flags about{' '}
          {fraction(FIXTURE_FLAGGED_SHARE)} of simulated photo households at random and has no
          photos to show.
        </Notice>
      ) : null}

      <Card padded={false}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          empty={
            flagged.isLoading ? 'Loading flagged readings.' : 'No readings are waiting for review.'
          }
        />
      </Card>
      <Txt size="xs" tone="muted">
        An approved cut counts in full toward the barangay total; a rejected one earns nothing and
        cannot be resubmitted. Meter photos and readings are personal data: they are shown here for
        review only, and results everywhere else are per barangay.
      </Txt>
    </>
  );
}
