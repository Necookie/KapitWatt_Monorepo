import { useTheme } from '@kapitwatt/hooks';
import { View } from 'react-native';
import { Split } from '@/components/Split';
import { Notice } from '@/components/ui/Notice';
import { errorMessage } from '@/api/client';
import { useLayoutValue } from '@/hooks/useLayoutValue';
import { motion } from '@/styles/motion';
import { BarangayCards } from '../components/BarangayCards';
import { BonusNote } from '../components/BonusNote';
import { TargetEditBar } from '../components/TargetEditBar';
import { TownEmptyState } from '../components/TownEmptyState';
import { TownHero } from '../components/TownHero';
import { TownSkeleton } from '../components/TownSkeleton';
import { TownTiles } from '../components/TownTiles';
import { useTargetDraft } from '../hooks/useTargetDraft';
import { useTownDetail } from '../hooks/useTownDetail';

/**
 * One town under the current alert, drilled into from Live load: the indigo hero with the town's
 * figure and ring beside committed and delivery by path, then a card per barangay against its own
 * share, where the operator can override the shares until the window ends.
 */
export default function TownDetailPage() {
  const t = useTheme();
  const [wide, onLayout] = useLayoutValue((w) => w >= 960);
  const { name, alert, totals, town, status, measured, failed, loading, forecast, editable } =
    useTownDetail();
  const draft = useTargetDraft(town, totals.data, alert.data?.id);

  return (
    <View onLayout={onLayout} style={{ gap: t.space[4] }}>
      {failed ? <Notice tone="critical">{errorMessage(failed)}</Notice> : null}

      {loading ? (
        <TownSkeleton wide={wide} />
      ) : town && alert.data && status ? (
        <View style={[{ gap: t.space[4] }, motion.fadeIn]}>
          <Split wide={wide}>
            <TownHero
              alert={alert.data}
              status={status}
              town={town}
              measured={measured}
              forecast={forecast}
            />
            <TownTiles town={town} measured={measured} />
          </Split>

          <BarangayCards
            rows={town.barangays}
            measured={measured}
            editable={editable}
            editing={draft.editing}
            typed={draft.typed}
            onChangeTarget={draft.setTarget}
            onEdit={draft.startEditing}
            editBar={
              <TargetEditBar
                invalid={draft.invalid}
                alertTargetKw={totals.data?.targetKw ?? 0}
                allTargets={draft.allTargets}
                saving={draft.save.isPending}
                canSave={!draft.invalid && draft.changedCount > 0}
                onCancel={draft.stopEditing}
                onSave={() => draft.save.mutate(undefined, { onSuccess: draft.stopEditing })}
              />
            }
          />
          {draft.save.error ? (
            <Notice tone="critical">{errorMessage(draft.save.error)}</Notice>
          ) : null}

          <BonusNote />
        </View>
      ) : (
        <View style={motion.fadeIn}>
          <TownEmptyState name={name} hasAlert={Boolean(alert.data)} />
        </View>
      )}
    </View>
  );
}
