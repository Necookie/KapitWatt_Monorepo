import { PILOT_BARANGAYS, type Barangay } from '@kapitwatt/shared';
import type { Db } from '../index';

/** Towns and barangays for the sign-up picker and the alert form. */
export async function listBarangays(db: Db): Promise<Barangay[]> {
  const rows = await db`
    select id, name, municipality, feeder_id
    from barangays
    order by municipality, name`;
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    municipality: r.municipality as string,
    feederId: (r.feeder_id as string | null) ?? null,
  }));
}

/**
 * Barangays with their opted-in household count (real and simulated), for the sign-up picker and the
 * alert form's confirm step ("about 1,200 households"). One query.
 */
export async function listBarangaysWithCounts(
  db: Db,
): Promise<(Barangay & { optedInHouseholds: number })[]> {
  const rows = await db`
    select b.id, b.name, b.municipality, b.feeder_id,
           count(h.id) filter (where h.opted_in)::int as opted_in
    from barangays b left join households h on h.barangay_id = b.id
    group by b.id
    order by b.municipality, b.name`;
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    municipality: r.municipality as string,
    feederId: (r.feeder_id as string | null) ?? null,
    optedInHouseholds: Number(r.opted_in),
  }));
}

/**
 * Loads the pilot barangays (reference data, not simulated rows). One request,
 * idempotent: existing (municipality, name) pairs are left alone.
 * Returns how many rows were newly inserted.
 */
export async function seedPilotBarangays(db: Db): Promise<number> {
  const names: string[] = [];
  const towns: string[] = [];
  for (const [town, barangays] of Object.entries(PILOT_BARANGAYS)) {
    for (const name of barangays) {
      names.push(name);
      towns.push(town);
    }
  }
  const inserted = await db`
    insert into barangays (name, municipality)
    select * from unnest(${names}::text[], ${towns}::text[])
    on conflict (municipality, name) do nothing
    returning id`;
  return inserted.length;
}

export async function insertBarangay(
  db: Db,
  input: Pick<Barangay, 'name' | 'municipality'> & { feederId?: string | null },
): Promise<Barangay> {
  const [r] = await db`
    insert into barangays (name, municipality, feeder_id)
    values (${input.name}, ${input.municipality}, ${input.feederId ?? null})
    returning id, name, municipality, feeder_id`;
  if (!r) throw new Error('insertBarangay: no row returned');
  return {
    id: r.id as string,
    name: r.name as string,
    municipality: r.municipality as string,
    feederId: (r.feeder_id as string | null) ?? null,
  };
}

export async function deleteBarangay(db: Db, id: string): Promise<void> {
  await db`delete from barangays where id = ${id}`;
}
