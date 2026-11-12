import { describe, expect, it } from 'vitest';
import { MemoryBackend } from './memory';
import { DEFAULT_PARAMS, PRESETS } from './presets';

const WINDOW = {
  windowStart: '2026-11-13T10:00:00.000Z',
  windowEnd: '2026-11-13T12:00:00.000Z',
};

function setup(sleeps: number[] = []) {
  const backend = new MemoryBackend({
    sleep: async (ms) => {
      sleeps.push(ms);
    },
  });
  backend.seed(DEFAULT_PARAMS);
  const alert = backend.createAlert({
    level: 'red',
    ...WINDOW,
    targetKw: 600,
    targetBarangayIds: [],
    message: 'test',
  });
  return { backend, alertId: alert.id };
}

async function fullRun(params = DEFAULT_PARAMS) {
  const { backend, alertId } = setup();
  await backend.run(alertId, params, 'commit');
  backend.fastForward(alertId, 'window_start');
  backend.fastForward(alertId, 'window_end');
  await backend.run(alertId, params, 'deliver');
  backend.settle(alertId);
  return backend.totals(alertId);
}

describe('a full simulated event (FR-SIM-10)', () => {
  it('seeds 1,200 households at about 15% smart meter', () => {
    const { backend } = setup();
    const status = backend.status();
    expect(status.households).toBe(1200);
    expect(status.amiHouseholds / status.households).toBeCloseTo(0.15, 1);
  });

  it('commits about 720 kW against a 600 kW target', async () => {
    const { backend, alertId } = setup();
    const summary = await backend.run(alertId, DEFAULT_PARAMS, 'commit');
    const totals = backend.totals(alertId);
    expect(Math.abs(totals.committedKw - 720)).toBeLessThan(10);
    expect(summary.committedKw).toBe(totals.committedKw);
    expect(totals.deliveredKw).toBe(0);
  });

  it('delivers about 527 kW, about 86 kW of it from smart meters', async () => {
    const totals = await fullRun();
    expect(Math.abs(totals.deliveredKw - 527)).toBeLessThan(25);
    expect(Math.abs((totals.deliveredAmiKw ?? 0) - 86)).toBeLessThan(15);
    expect(Math.abs((totals.deliveredPhotoKw ?? 0) - 441)).toBeLessThan(25);
    expect(totals.status).toBe('settled');
  });

  it('lets some barangays reach their target and leaves others short', async () => {
    const totals = await fullRun();
    const hit = totals.barangays.filter((b) => b.targetHit).length;
    expect(totals.barangays).toHaveLength(21);
    expect(hit).toBeGreaterThan(0);
    expect(hit).toBeLessThan(21);
  });

  it('gives the same result for the same seed and a different one for another seed', async () => {
    const a = await fullRun();
    const b = await fullRun();
    const c = await fullRun({ ...DEFAULT_PARAMS, seed: 7 });
    expect(b).toEqual(a);
    expect(c.barangays.map((x) => x.deliveredKw)).not.toEqual(
      a.barangays.map((x) => x.deliveredKw),
    );
  });

  it('follows the participation preset', async () => {
    const poor = await fullRun(PRESETS.poor);
    expect(Math.abs(poor.committedKw - 360)).toBeLessThan(10);
  });
});

describe('pacing and safety', () => {
  it('spreads commits over the pace', async () => {
    const sleeps: number[] = [];
    const { backend, alertId } = setup(sleeps);
    await backend.run(alertId, DEFAULT_PARAMS, 'commit');
    expect(sleeps.length).toBeGreaterThanOrEqual(20);
    const total = sleeps.reduce((a, b) => a + b, 0);
    expect(total).toBeLessThanOrEqual(DEFAULT_PARAMS.paceSeconds * 1000);
    expect(total).toBeGreaterThan(20_000);
  });

  it('adds nothing when the commit phase is run twice', async () => {
    const { backend, alertId } = setup();
    await backend.run(alertId, DEFAULT_PARAMS, 'commit');
    const first = backend.totals(alertId).committedKw;
    await backend.run(alertId, DEFAULT_PARAMS, 'commit');
    expect(backend.totals(alertId).committedKw).toBe(first);
  });

  it('refuses commits once the window has opened', async () => {
    const { backend, alertId } = setup();
    backend.fastForward(alertId, 'window_start');
    await backend.run(alertId, DEFAULT_PARAMS, 'commit');
    expect(backend.totals(alertId).committedKw).toBe(0);
  });

  it('reset clears simulated households and the open alert', async () => {
    const { backend, alertId } = setup();
    await backend.run(alertId, DEFAULT_PARAMS, 'commit');
    backend.reset();
    expect(backend.status().households).toBe(0);
    expect(backend.currentAlert()).toBeNull();
    expect(backend.totals(alertId).committedKw).toBe(0);
  });

  it('reset also drops a settled alert from view, and a new alert becomes current', async () => {
    const { backend, alertId } = setup();
    backend.fastForward(alertId, 'window_end');
    backend.settle(alertId);
    expect(backend.currentAlert()?.id).toBe(alertId);
    backend.reset();
    expect(backend.currentAlert()).toBeNull();
    backend.seed(DEFAULT_PARAMS);
    const next = backend.createAlert({
      level: 'yellow',
      ...WINDOW,
      targetKw: 300,
      targetBarangayIds: [],
      message: 'test',
    });
    expect(backend.currentAlert()?.id).toBe(next.id);
  });

  it('targets only the chosen barangays', async () => {
    const backend = new MemoryBackend({ sleep: async () => {} });
    backend.seed(DEFAULT_PARAMS);
    const santaCruz = backend.listBarangays().filter((b) => b.municipality === 'Santa Cruz');
    const alert = backend.createAlert({
      level: 'yellow',
      ...WINDOW,
      targetKw: 100,
      targetBarangayIds: santaCruz.map((b) => b.id),
      message: 'test',
    });
    await backend.run(alert.id, DEFAULT_PARAMS, 'commit');
    const totals = backend.totals(alert.id);
    expect(totals.barangays).toHaveLength(3);
    expect(Math.abs(totals.committedKw - 350 * 0.6)).toBeLessThan(8);
    expect(totals.barangays.reduce((sum, b) => sum + b.targetKw, 0)).toBeCloseTo(100, 0);
  });
});
