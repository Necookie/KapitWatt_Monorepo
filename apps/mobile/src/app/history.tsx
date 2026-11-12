import { StyleSheet, Text } from 'react-native';
import { AlertBadge } from '@/components/event/AlertBadge';
import { Card, ErrorState, Loading, Row, Screen } from '@/components/ui';
import { formatClock, formatKw, formatKwh, formatPhp } from '@/lib/format';
import { useHistory, useRefreshAll } from '@/lib/queries';
import { colors, fonts, text } from '@/theme';

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** Past events and their results (FR-APP-16). */
export default function HistoryScreen() {
  const history = useHistory();
  const refreshAll = useRefreshAll();

  if (history.isPending) return <Loading />;
  if (history.isError) return <ErrorState onRetry={() => void history.refetch()} />;

  return (
    <Screen onRefresh={refreshAll}>
      {history.data.length === 0 ? (
        <Card title="No events yet">
          <Text style={styles.body}>Your past grid events will show up here.</Text>
        </Card>
      ) : null}
      {history.data.map((item) => (
        <Card key={item.alert.id}>
          <AlertBadge level={item.alert.level} />
          <Text style={styles.title}>
            {dateLabel(item.alert.windowStart)}, {formatClock(item.alert.windowStart)} to{' '}
            {formatClock(item.alert.windowEnd)}
          </Text>
          <Row label="Committed" value={formatKw(item.committedKw)} />
          {item.result ? (
            <>
              <Row label="Verified" value={formatKwh(item.result.verifiedKwh)} />
              <Row
                label="Earned"
                value={`${formatPhp(item.result.creditPhp + item.result.bonusPhp)} · ${item.result.points} pts`}
                strong
              />
              {item.result.verifiedKwh === 0 ? (
                <Text style={styles.zero}>No payout for this event.</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.body}>Waiting for results.</Text>
          )}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...text.body, fontFamily: fonts.semibold, color: colors.ink },
  body: { ...text.body, color: colors.muted },
  zero: { ...text.caption, color: colors.red },
});
