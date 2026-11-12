import type { FunnelRow } from '@kapitwatt/db';
import { describe, expect, it } from 'vitest';
import { commitTimeline, funnelStages, outcomeOf } from '../services/analytics';
import { call } from './helpers';

describe('outcomeOf', () => {
  it('maps commitment status and reason to an operator outcome', () => {
    expect(outcomeOf('verified', null)).toBe('verified');
    expect(outcomeOf('committed', null)).toBe('awaiting_settlement');
    expect(outcomeOf('flagged', 'failed_check')).toBe('pending_review');
    expect(outcomeOf('flagged', 'missing_ami_data')).toBe('missing_ami_data');
    expect(outcomeOf('unverified', 'missing_photo')).toBe('missing_photo');
    expect(outcomeOf('unverified', 'late_photo')).toBe('late_photo');
    expect(outcomeOf('unverified', null)).toBe('failed_check');
  });
});

describe('funnelStages', () => {
  const row = (path: 'ami' | 'photo', n: number[]): FunnelRow => ({
    path,
    committed: n[0]!,
    committedKw: n[0]!,
    beforeSent: n[1]!,
    bothPassed: n[2]!,
    amiAny: n[1]!,
    amiComplete: n[2]!,
    verified: n[3]!,
    verifiedKwh: 0,
    paidPhp: 0,
  });

  it('puts both paths side by side, stage by stage', () => {
    expect(
      funnelStages([row('ami', [100, 100, 98, 95]), row('photo', [600, 560, 540, 500])]),
    ).toEqual([
      { stage: 'committed', ami: 100, photo: 600 },
      { stage: 'evidence_started', ami: 100, photo: 560 },
      { stage: 'evidence_complete', ami: 98, photo: 540 },
      { stage: 'verified', ami: 95, photo: 500 },
    ]);
  });

  it('shows zeros for a path with no commitments', () => {
    expect(funnelStages([]).every((s) => s.ami === 0 && s.photo === 0)).toBe(true);
  });
});

describe('commitTimeline', () => {
  const t0 = new Date('2026-11-12T10:00:00Z').getTime();
  const rows = Array.from({ length: 300 }, (_, i) => ({ at: new Date(t0 + i * 100), kw: 1 }));

  it('is cumulative, ends at the total and caps the number of points', () => {
    const line = commitTimeline(rows, 60);
    expect(line).toHaveLength(60);
    expect(line[0]!.households).toBe(1);
    expect(line.at(-1)).toMatchObject({ committedKw: 300, households: 300 });
    expect(line.every((p, i) => i === 0 || p.committedKw >= line[i - 1]!.committedKw)).toBe(true);
  });

  it('handles no commitments and a single one', () => {
    expect(commitTimeline([])).toEqual([]);
    expect(commitTimeline([{ at: new Date(t0), kw: 1.5 }])).toEqual([
      { at: new Date(t0).toISOString(), committedKw: 1.5, households: 1 },
    ]);
  });
});

describe('analytics routes (before the database)', () => {
  it('are operator-only and validate the id', async () => {
    expect((await call('/analytics/history')).status).toBe(401);
    expect((await call('/analytics/alerts/11111111-1111-4111-8111-111111111111')).status).toBe(401);
  });
});
