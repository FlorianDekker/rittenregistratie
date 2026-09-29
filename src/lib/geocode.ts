// Reverse geocoding via Nominatim (OpenStreetMap), voor als het adresveld
// leeg is in het rittenlog. Nominatim vraagt max. 1 request/seconde; we
// bewaken dat hier met een simpele module-brede wachtrij.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const MIN_INTERVAL_MS = 1000;

let lastCallAt = 0;
let queue: Promise<void> = Promise.resolve();

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttle(): Promise<void> {
  const run = async () => {
    const elapsed = Date.now() - lastCallAt;
    if (elapsed < MIN_INTERVAL_MS) {
      await wait(MIN_INTERVAL_MS - elapsed);
    }
    lastCallAt = Date.now();
  };
  const next = queue.then(run);
  queue = next.catch(() => undefined);
  return next;
}

interface NominatimResponse {
  display_name?: string;
  address?: Record<string, string>;
}

/** Reverse-geocodet een coördinaat naar een leesbaar adres, of null bij fout. */
export async function reverseGeocode(
  lat: number,
  lon: number,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  await throttle();
  try {
    const url = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lon}`;
    const res = await fetchImpl(url, {
      headers: { Accept: 'application/json', 'Accept-Language': 'nl' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResponse;
    return data.display_name ?? null;
  } catch {
    return null;
  }
}
