import { useTheme } from '@kapitwatt/hooks';
import { Text } from '@kapitwatt/ui';
import { View } from 'react-native';
import { Panel } from '@/components/Panel';
import { Split } from '@/components/Split';
import { useLayoutValue } from '@/hooks/useLayoutValue';
import { Notice } from '@/components/ui/Notice';
import { FIXTURE_FLAGGED_SHARE, USE_FIXTURES, errorMessage } from '@/api/client';
import { fraction } from '@/utils/format';
import { useFlagged } from '../api/useFlagged';
import { useReviewReading } from '../api/useReviewReading';
import { AllClear } from '../components/AllClear';
import { FilterBar } from '../components/FilterBar';
import { ReviewPane } from '../components/ReviewPane';
import { ReviewQueue } from '../components/ReviewQueue';
import { useDecisionKeys } from '../hooks/useDecisionKeys';
import { useReviewQueue } from '../hooks/useReviewQueue';

/**
 * FR-DASH-11: readings that failed a rule check, for a person to approve or reject. A queue beside
 * a review pane: pick a reading, see its photo and what failed in plain words, decide; the next one
 * opens. A and R decide from the keyboard.
 */
export default function FlaggedPage() {
  const t = useTheme();
  const flagged = useFlagged();
  const review = useReviewReading();
  const [beside, onLayout] = useLayoutValue((w) => w >= 900);
  const all = flagged.data ?? [];
  const queue = useReviewQueue(all, review);
  useDecisionKeys(queue.decide);

  return (
    <View onLayout={onLayout} style={{ gap: t.space[4] }}>
      {flagged.error ? <Notice tone="critical">{errorMessage(flagged.error)}</Notice> : null}
      {review.error ? <Notice tone="critical">{errorMessage(review.error)}</Notice> : null}
      {USE_FIXTURES ? (
        <Notice tone="brand">
          Fixture data: the in-browser backend runs no photo checks, so it flags about{' '}
          {fraction(FIXTURE_FLAGGED_SHARE)} of simulated photo households at random and has no
          photos to show.
        </Notice>
      ) : null}

      {all.length === 0 ? (
        <AllClear loading={flagged.isLoading} />
      ) : (
        <>
          <FilterBar
            total={all.length}
            oldest={queue.oldest}
            counts={queue.counts}
            filter={queue.filter}
            onFilter={queue.setFilter}
          />

          <Split wide={beside} ratio={[4, 7]}>
            <Panel title="Queue" subtitle={`${queue.rows.length} shown, newest first`}>
              <ReviewQueue
                rows={queue.rows}
                selectedId={queue.selected?.id}
                onSelect={queue.setSelectedId}
              />
            </Panel>
            <View
              style={{
                padding: t.space[6],
                borderRadius: t.radius.lg,
                backgroundColor: t.color.surfaceContainerLowest,
                borderWidth: t.borderWidth.hairline,
                borderColor: t.color.outlineVariant,
              }}
            >
              {queue.selected ? (
                <ReviewPane
                  key={queue.selected.id}
                  reading={queue.selected}
                  deciding={queue.deciding}
                  disabled={review.isPending}
                  onDecide={queue.decide}
                />
              ) : (
                <Text variant="bodyMedium" color="onSurfaceVariant">
                  No readings match this filter.
                </Text>
              )}
            </View>
          </Split>
        </>
      )}

      <Text variant="bodySmall" color="onSurfaceVariant">
        Meter photos and readings are personal data: they are shown here for review only, and
        results everywhere else are per barangay.
      </Text>
    </View>
  );
}
