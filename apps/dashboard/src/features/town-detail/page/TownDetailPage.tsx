import { Card } from '@/components/ui/Card';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { Txt } from '@/components/ui/Txt';
import { errorMessage } from '@/api/client';
import { BarangayTable } from '../components/BarangayTable';
import { TargetDraftNotice } from '../components/TargetDraftNotice';
import { TargetEditActions } from '../components/TargetEditActions';
import { TownBreadcrumb } from '../components/TownBreadcrumb';
import { TownEmptyState } from '../components/TownEmptyState';
import { TownFigures } from '../components/TownFigures';
import { TownFiguresSkeleton } from '../components/TownFiguresSkeleton';
import { useTargetDraft } from '../hooks/useTargetDraft';
import { useTownDetail } from '../hooks/useTownDetail';

export default function TownDetailPage() {
  const { name, alert, totals, town, measured, failed, editable } = useTownDetail();
  const draft = useTargetDraft(town, totals.data, alert.data?.id);

  return (
    <>
      <TownBreadcrumb name={name} />

      <PageHeader
        title={name ?? 'Town'}
        subtitle="Delivered load against each barangay's own share of the target."
      />

      {failed ? <Notice tone="critical">{errorMessage(failed)}</Notice> : null}

      {town ? (
        <>
          <TownFigures town={town} measured={measured} />
          <Card
            title="Barangays"
            padded={false}
            aside={
              <TargetEditActions
                editing={draft.editing}
                editable={editable}
                saving={draft.save.isPending}
                canSave={!draft.invalid && draft.changedCount > 0}
                onEdit={draft.startEditing}
                onCancel={draft.stopEditing}
                onSave={() => draft.save.mutate(undefined, { onSuccess: draft.stopEditing })}
              />
            }
          >
            <BarangayTable
              rows={town.barangays}
              measured={measured}
              editing={draft.editing}
              typed={draft.typed}
              onChangeTarget={draft.setTarget}
            />
          </Card>
          {draft.save.error ? (
            <Notice tone="critical">{errorMessage(draft.save.error)}</Notice>
          ) : null}
          {draft.editing ? (
            <TargetDraftNotice
              invalid={draft.invalid}
              alertTargetKw={totals.data?.targetKw ?? 0}
              allTargets={draft.allTargets}
            />
          ) : null}
          <Txt size="xs" tone="muted">
            A barangay that reaches 100% of its target at settlement earns every household there
            with a verified cut a bonus on its own credit. The bonus rate is a placeholder.
          </Txt>
        </>
      ) : alert.isLoading || totals.isLoading ? (
        <>
          <TownFiguresSkeleton />
          <Card title="Barangays" padded={false}>
            <BarangayTable rows={[]} measured={measured} loading />
          </Card>
        </>
      ) : (
        <TownEmptyState hasAlert={Boolean(alert.data)} />
      )}
    </>
  );
}
