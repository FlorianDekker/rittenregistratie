import { haversineKm } from './distance';

// Suggereert ritten om samen te voegen: bv. een STOP gevolgd door een nieuwe
// START op (ongeveer) dezelfde plek binnen 15 minuten (typisch een tankstop
// of korte onderbreking die geen aparte rit hoort te zijn).

export interface MergeCandidateTrip {
  id: string;
  endTimeMs: number;
  endLat: number;
  endLon: number;
  startTimeMs: number;
  startLat: number;
  startLon: number;
}

export interface MergeSuggestion {
  firstTripId: string;
  secondTripId: string;
  gapMinutes: number;
  distanceMetersBetweenStops: number;
}

const MAX_GAP_MINUTES = 15;
const MAX_DISTANCE_METERS = 300;

/**
 * Zoekt paren van opeenvolgende ritten waarvan de eerste eindigt vlak bij en
 * kort voor het vertrekpunt van de tweede rit.
 */
export function suggestMerges(trips: MergeCandidateTrip[]): MergeSuggestion[] {
  const sorted = [...trips].sort((a, b) => a.startTimeMs - b.startTimeMs);
  const suggestions: MergeSuggestion[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const gapMinutes = (b.startTimeMs - a.endTimeMs) / 60000;
    if (gapMinutes < 0 || gapMinutes > MAX_GAP_MINUTES) continue;

    const distanceMeters = haversineKm(a.endLat, a.endLon, b.startLat, b.startLon) * 1000;
    if (distanceMeters > MAX_DISTANCE_METERS) continue;

    suggestions.push({
      firstTripId: a.id,
      secondTripId: b.id,
      gapMinutes: Math.round(gapMinutes * 10) / 10,
      distanceMetersBetweenStops: Math.round(distanceMeters),
    });
  }

  return suggestions;
}
