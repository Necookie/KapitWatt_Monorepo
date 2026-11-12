import { getResultRow, getRewardsSummary, listLeaderboard, type Db } from '@kapitwatt/db';
import {
  roundKw,
  roundPhp,
  type LeaderboardRow,
  type ResultCard,
  type RewardsSummary,
} from '@kapitwatt/shared';
import { AppError } from '../lib/errors';
import { alertTotals } from './totals';

/**
 * FR-API-60: the household's result card for an alert. 404 not_settled until settlement has run
 * (the app shows "results after settlement" until then), 404 not_committed if it never committed.
 */
export async function resultCard(
  db: Db,
  householdId: string,
  alertId: string,
  isDemo: boolean,
): Promise<ResultCard> {
  const row = await getResultRow(db, householdId, alertId);
  if (!row) throw new AppError(404, 'not_committed', 'No commitment for this alert.');
  if (!row.alertSettled || !row.hasReward) {
    throw new AppError(404, 'not_settled', 'Results are ready after settlement.');
  }
  const totals = await alertTotals(db, alertId, isDemo);
  const b = totals.barangays.find((x) => x.barangayId === row.barangayId);
  if (!b) throw new Error('result barangay missing from alert targets');
  return {
    alertId: row.alertId,
    path: row.path,
    status: row.status,
    committedKw: row.committedKw,
    verifiedKwh: row.verifiedKwh ?? 0,
    creditPhp: row.creditPhp,
    bonusPhp: row.bonusPhp,
    points: row.points,
    barangay: {
      barangayId: b.barangayId,
      name: b.name,
      targetKw: b.targetKw,
      deliveredKw: b.deliveredKw,
      progress: b.targetKw > 0 ? b.deliveredKw / b.targetKw : 0,
      targetHit: b.targetHit,
    },
    resultReason: row.resultReason,
    cutKw: row.actualKw === null ? null : roundKw(Math.max(0, row.baselineKw - row.actualKw)),
    paidCutKw: row.verifiedKwh === null ? null : roundKw(row.verifiedKwh / row.windowHours),
  };
}

export async function rewardsSummary(db: Db, householdId: string): Promise<RewardsSummary> {
  const s = await getRewardsSummary(db, householdId);
  return { ...s, creditPhp: roundPhp(s.creditPhp), bonusPhp: roundPhp(s.bonusPhp) };
}

export async function leaderboard(db: Db): Promise<LeaderboardRow[]> {
  return (await listLeaderboard(db)).map((r) => ({
    ...r,
    verifiedKwh: Math.round(r.verifiedKwh * 1000) / 1000,
  }));
}
