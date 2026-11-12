import type { Barangay } from '@kapitwatt/shared';
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
