import { haversineKm } from './distance';

// Matcht een coördinaat aan een vaste locatie (bv. "Thuis", "Kantoor") als
// het punt binnen de straal van die locatie valt. Bij meerdere treffers wint
// de dichtstbijzijnde.

export interface MatchableLocation {
  id: string;
  lat: number;
  lon: number;
  radiusM: number;
}

export function matchLocation<T extends MatchableLocation>(
  lat: number,
  lon: number,
  locations: T[],
): T | undefined {
  let best: T | undefined;
  let bestDistanceM = Infinity;

  for (const loc of locations) {
    const distanceM = haversineKm(lat, lon, loc.lat, loc.lon) * 1000;
    if (distanceM <= loc.radiusM && distanceM < bestDistanceM) {
      best = loc;
      bestDistanceM = distanceM;
    }
  }

  return best;
}

export interface PairRuleLike {
  fromLocationId: string;
  toLocationId: string;
}

/** Zoekt de standaardregel voor een locatiepaar (richting maakt uit). */
export function findPairRule<T extends PairRuleLike>(
  fromLocationId: string | undefined,
  toLocationId: string | undefined,
  rules: T[],
): T | undefined {
  if (!fromLocationId || !toLocationId) return undefined;
  return rules.find((r) => r.fromLocationId === fromLocationId && r.toLocationId === toLocationId);
}
