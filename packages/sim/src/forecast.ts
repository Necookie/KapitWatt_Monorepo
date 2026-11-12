import type { SimParams } from '@kapitwatt/shared';
import { followThroughFor } from './runner';

export interface ReliefForecast {
  deliveredAmiKw: number;
  deliveredPhotoKw: number;
  deliveredKw: number;
}

export interface ExpectedOutcome extends ReliefForecast {
  committedKw: number;
}

/**
 * The relief to expect from a committed load: committed kW times follow-through, per
 * path, less the photo households that miss a photo. The path split is the assumed one
 * (`amiShare`), since committed totals are not reported per path.
 */
export function reliefForecast(committedKw: number, p: SimParams): ReliefForecast {
  const deliveredAmiKw = committedKw * p.amiShare * followThroughFor('ami', p);
  const deliveredPhotoKw =
    committedKw * (1 - p.amiShare) * followThroughFor('standard', p) * p.photoCompletion;
  return { deliveredAmiKw, deliveredPhotoKw, deliveredKw: deliveredAmiKw + deliveredPhotoKw };
}

/**
 * Expected totals for a run, before any randomness. This is the arithmetic
 * behind the demo numbers and the dashboard's relief forecast
 * (committed x follow-through).
 */
export function expectedOutcome(households: number, p: SimParams): ExpectedOutcome {
  const committedKw = households * p.participation * p.cutKw;
  return { committedKw, ...reliefForecast(committedKw, p) };
}
