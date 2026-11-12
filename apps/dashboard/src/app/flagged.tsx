import type { FlaggedReading, ReadingFlag, ReadingKind } from '@kapitwatt/shared';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { DataTable, type Column } from '@/components/DataTable';
import { Button, Card, Notice, PageHeader, Tag, Txt } from '@/components/ui';
import { FIXTURE_FLAGGED_SHARE, USE_FIXTURES, client, errorMessage } from '@/lib/client';
import { dayAndClock, fraction, reading } from '@/lib/format';
import { useAction, useFlagged } from '@/lib/queries';
import { colors, radius, space } from '@/theme';

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
  const [viewing, setViewing] = useState<FlaggedReading | null>(null);
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
      width: 110,
      render: (r) => (
        <View style={{ gap: 2, alignItems: 'flex-start' }}>
          <Txt>{KIND_LABEL[r.kind]}</Txt>
          {r.hasPhoto ? (
            <Button small kind="ghost" label="View photo" onPress={() => setViewing(r)} />
          ) : (
            <Txt size="xs" tone="faint">
              No photo
            </Txt>
          )}
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
          flagged.data && !flagged.error ? (
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
          loading={flagged.isLoading}
          empty={
            flagged.error
              ? 'The review list could not be loaded.'
              : 'No readings are waiting for review.'
          }
        />
      </Card>
      <Txt size="xs" tone="muted">
        An approved cut counts in full toward the barangay total; a rejected one earns nothing and
        cannot be resubmitted. Meter photos and readings are personal data: they are shown here for
        review only, and results everywhere else are per barangay.
      </Txt>

      {viewing ? (
        <PhotoDialog
          reading={viewing}
          busy={review.isPending}
          onClose={() => setViewing(null)}
          onDecide={(decision) =>
            review.mutate({ id: viewing.id, decision }, { onSuccess: () => setViewing(null) })
          }
        />
      ) : null}
    </>
  );
}

/**
 * The photo beside what the household typed, so a person can do the checks no rule does:
 * read the register and match the serial on the meter to the registered one.
 */
function PhotoDialog({
  reading: r,
  busy,
  onClose,
  onDecide,
}: {
  reading: FlaggedReading;
  busy: boolean;
  onClose: () => void;
  onDecide: (decision: 'approve' | 'reject') => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let made: string | null = null;
    let closed = false;
    client.readingPhoto(r.id).then(
      (blobUrl) => {
        made = blobUrl;
        // The dialog closed before the photo arrived: nothing will show it.
        if (closed) URL.revokeObjectURL(blobUrl);
        else setUrl(blobUrl);
      },
      (reason: unknown) => {
        if (!closed) setError(reason);
      },
    );
    return () => {
      closed = true;
      // A meter photo is personal data: do not keep it in the page once the dialog closes.
      if (made) URL.revokeObjectURL(made);
    };
  }, [r.id]);

  return (
    <Modal transparent visible onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityRole="alert">
          <Txt size="lg" tone="ink" weight="600">
            {KIND_LABEL[r.kind]} photo, {r.barangayName}, {r.municipality}
          </Txt>
          <View style={styles.photo}>
            {url ? (
              <img
                src={url}
                alt={`Meter photo for serial ${r.meterSerial}`}
                style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain' }}
              />
            ) : error ? (
              <Notice tone="critical">{errorMessage(error)}</Notice>
            ) : (
              <ActivityIndicator color={colors.brandStrong} />
            )}
          </View>
          <View style={styles.facts}>
            <Fact label="Registered serial" value={r.meterSerial} />
            <Fact label="Typed reading" value={`${reading(r.readingKwh)} kWh`} />
            <Fact
              label="Previous reading"
              value={r.previousKwh === null ? '—' : `${reading(r.previousKwh)} kWh`}
            />
            <Fact label="Captured" value={dayAndClock(r.capturedAt)} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {r.flags.map((flag) => (
              <Tag key={flag} tone="warning" label={FLAG_LABEL[flag]} />
            ))}
          </View>
          <Txt size="xs" tone="muted">
            Check that the serial on the meter matches the registered one and that the register
            shows the typed reading.
          </Txt>
          <View style={styles.dialogActions}>
            <Button label="Close" disabled={busy} onPress={onClose} />
            <Button label="Reject" disabled={busy} onPress={() => onDecide('reject')} />
            <Button
              kind="primary"
              label="Approve"
              disabled={busy}
              onPress={() => onDecide('approve')}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ minWidth: 120, gap: 2 }}>
      <Txt size="xs" tone="muted">
        {label}
      </Txt>
      <Txt tone="ink" weight="600" numeric>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    backgroundColor: 'rgba(31, 26, 21, 0.45)',
  },
  dialog: {
    width: '100%',
    maxWidth: 640,
    gap: space.md,
    padding: space.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  photo: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
});
