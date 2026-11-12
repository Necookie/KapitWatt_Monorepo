import { Chip } from '@kapitwatt/ui';
import { USE_FIXTURES } from '@/api/client';

/** Only the fixture build is marked: the live API is the normal case and needs no badge. */
export function DataSource({ dense = false }: { dense?: boolean }) {
  return USE_FIXTURES ? (
    <Chip label={dense ? 'Fixtures' : 'Fixture data, in browser'} tone="simulated" />
  ) : null;
}
