// Afstandsberekening tussen twee coördinaten.
// Voorkeur: routeafstand via OSRM (rijafstand). Fallback: hemelsbreed × 1,25
// (ruwe schatting voor als OSRM niet bereikbaar is), gemarkeerd als "estimated".

export interface DistanceResult {
  km: number;
  estimated: boolean;
}

const EARTH_RADIUS_KM = 6371;

/** Hemelsbrede afstand tussen twee punten (Haversine-formule), in km. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Schatting op basis van hemelsbrede afstand × correctiefactor voor wegen. */
export function estimateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return round1(haversineKm(lat1, lon1, lat2, lon2) * 1.25);
}

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

interface OsrmResponse {
  code: string;
  routes?: { distance: number }[];
}

/**
 * Haalt de rijafstand op via OSRM. Bij een fout, timeout of offline situatie
 * valt de functie terug op de hemelsbrede schatting × 1,25.
 */
export async function fetchDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  fetchImpl: typeof fetch = fetch,
): Promise<DistanceResult> {
  try {
    const url = `${OSRM_URL}/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const res = await fetchImpl(url);
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = (await res.json()) as OsrmResponse;
    const meters = data.routes?.[0]?.distance;
    if (data.code !== 'Ok' || typeof meters !== 'number') {
      throw new Error('OSRM: geen route gevonden');
    }
    return { km: round1(meters / 1000), estimated: false };
  } catch {
    return { km: estimateDistanceKm(lat1, lon1, lat2, lon2), estimated: true };
  }
}
