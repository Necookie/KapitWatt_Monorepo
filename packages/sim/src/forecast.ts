import type { SimParams } from '@kapitwatt/shared';
import { followThroughFor } from './runner';

export interface ExpectedOutcome {
  committedKw: number;
  deliveredAmiKw: number;
  deliveredPhotoKw: number;
  deliveredKw: number;
}

/**
 * Expected totals for a run, before any randomness. This is the arithmetic
 * behind the demo numbers and the dashboard's relief forecast
 * (committed x follow-through).
 */
export function expectedOutcome(households: number, p: SimParams): ExpectedOutcome {
  const committedKw = households * p.participation * p.cutKw;
  const deliveredAmiKw = committedKw * p.amiShare * followThroughFor('ami', p);
  const deliveredPhotoKw =
    committedKw * (1 - p.amiShare) * followThroughFor('standard', p) * p.photoCompletion;
  return {
    committedKw,
    deliveredAmiKw,
    deliveredPhotoKw,
    deliveredKw: deliveredAmiKw + deliveredPhotoKw,
  };
}
