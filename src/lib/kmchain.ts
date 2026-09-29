// Kilometerstand-keten: beginKm van een rit = eindKm van de vorige rit (of de
// start-km van de auto voor de allereerste rit). eindKm = beginKm + afstand.
//
// IJkpunt: de gebruiker voert een echte tellerstand + datum in. Het verschil
// tussen die echte stand en de berekende stand wordt proportioneel (naar
// rato van de afgelegde afstand per rit) verdeeld over de ritten sinds het
// vorige ijkpunt. Ritten vóór een ijkpunt worden nadien niet meer herrekend
// (ze worden "locked").

export interface ChainTrip {
  id: string;
  /** Tijdstip van vertrek, voor sortering. */
  startTimeMs: number;
  distanceKm: number;
  startOdometer: number;
  endOdometer: number;
  locked: boolean;
}

/**
 * Herberekent begin-/eindstand van een reeks ritten (chronologisch) op basis
 * van een startstand. Geeft nieuwe rit-objecten terug (geen mutatie).
 * Ritten met `locked: true` worden overgeslagen als anker: hun eigen standen
 * blijven ongewijzigd, en de keten gaat daarna verder vanaf hun eindstand.
 */
export function recomputeChain<T extends ChainTrip>(trips: T[], startOdometer: number): T[] {
  const sorted = [...trips].sort((a, b) => a.startTimeMs - b.startTimeMs);
  let current = startOdometer;
  const result: T[] = [];

  for (const trip of sorted) {
    if (trip.locked) {
      result.push(trip);
      current = trip.endOdometer;
      continue;
    }
    const begin = current;
    const end = round1(begin + trip.distanceKm);
    result.push({ ...trip, startOdometer: begin, endOdometer: end });
    current = end;
  }

  return result;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export interface CheckpointAdjustment {
  /** Ritten met bijgewerkte afstand/standen, in dezelfde volgorde als input. */
  trips: ChainTrip[];
  /** Verschil tussen echte en berekende stand op het ijkpunt (km). */
  diffKm: number;
}

/**
 * Verdeelt het verschil tussen de echte tellerstand op een ijkpunt en de
 * berekende stand proportioneel (naar rato van de afgelegde afstand) over de
 * ritten sinds het vorige ijkpunt, en herberekent daarna de keten.
 *
 * @param tripsSincePrevious ritten sinds het vorige ijkpunt (of vanaf het
 *   begin), chronologisch of niet — wordt intern gesorteerd.
 * @param startOdometer stand aan het begin van deze reeks (vorige ijkpunt of
 *   start-km van de auto).
 * @param actualOdometerAtCheckpoint de echte, ingevoerde tellerstand.
 */
export function applyCheckpoint(
  tripsSincePrevious: ChainTrip[],
  startOdometer: number,
  actualOdometerAtCheckpoint: number,
): CheckpointAdjustment {
  const sorted = [...tripsSincePrevious].sort((a, b) => a.startTimeMs - b.startTimeMs);
  const totalDistance = sorted.reduce((sum, t) => sum + t.distanceKm, 0);
  const calculatedEnd = startOdometer + totalDistance;
  const diffKm = round1(actualOdometerAtCheckpoint - calculatedEnd);

  if (sorted.length === 0 || diffKm === 0) {
    return { trips: recomputeChain(sorted, startOdometer), diffKm };
  }

  // Proportioneel verdelen naar rato van afstand. Als alle ritten 0 km zijn
  // (zou niet moeten voorkomen), verdeel dan gelijk.
  const adjusted = sorted.map((trip) => {
    const share =
      totalDistance > 0 ? (trip.distanceKm / totalDistance) * diffKm : diffKm / sorted.length;
    return { ...trip, distanceKm: round1(trip.distanceKm + share) };
  });

  const recomputed = recomputeChain(adjusted, startOdometer);
  // Corrigeer eventuele afrondingsverschillen op de laatste rit zodat de
  // eindstand exact gelijk is aan de ingevoerde, echte tellerstand.
  if (recomputed.length > 0) {
    const last = recomputed[recomputed.length - 1];
    const roundingFix = round1(actualOdometerAtCheckpoint - last.endOdometer);
    if (roundingFix !== 0) {
      last.endOdometer = round1(last.endOdometer + roundingFix);
      last.distanceKm = round1(last.distanceKm + roundingFix);
    }
  }

  return { trips: recomputed, diffKm };
}
