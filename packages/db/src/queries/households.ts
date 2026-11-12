import type { Db } from '../index';

/**
 * Resolves a household from the SHA-256 hash of its bearer token. The raw token never reaches the
 * database. Returns null for an unknown token.
 */
export async function findHouseholdByTokenHash(
  db: Db,
  tokenHash: string,
): Promise<{ id: string; optedIn: boolean } | null> {
  const [row] = await db`
    select id, opted_in from households
    where auth_token_hash = ${tokenHash} and not is_simulated`;
  return row ? { id: row.id as string, optedIn: row.opted_in as boolean } : null;
}
