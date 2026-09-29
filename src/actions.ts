// Orkestratie tussen de pure logica-modules (src/lib/*) en de database.
// Deze laag doet netwerk- en DB-werk en is daarom bewust dun gehouden; de
// eigenlijke logica staat (en wordt getest) in src/lib.

import { db, newId, upsertEvents } from './db';
import { parseRittenlog, type ParseWarning } from './lib/parser';
import { linkEvents, type LinkableEvent } from './lib/linking';
import { fetchDistanceKm } from './lib/distance';
import { reverseGeocode } from './lib/geocode';
import { recomputeChain, applyCheckpoint, type ChainTrip } from './lib/kmchain';
import { matchLocation, findPairRule } from './lib/locations';
import { isoDateFromMs } from './lib/format';
import type { Checkpoint, Location, LocationPairRule, RawEvent, Trip } from './types';

export interface ImportSummary {
  newTripsCount: number;
  parseWarnings: ParseWarning[];
  orphanStartsCount: number;
  orphanStopsCount: number;
  skippedDuplicateEvents: number;
}

/**
 * Verwerkt een (mogelijk groeiend) Rittenlog.txt-bestand voor een auto:
 * parsen, dedupliceren, koppelen tot ritten, en nieuwe ritten aanmaken met
 * status "te controleren". Bestaande ritten blijven ongemoeid.
 */
export async function runImport(carId: string, text: string): Promise<ImportSummary> {
  const { events: parsedEvents, warnings } = parseRittenlog(text);

  const existingIds = new Set((await db.events.toArray()).map((e) => e.id));
  const skippedDuplicateEvents = parsedEvents.filter((e) => existingIds.has(e.key)).length;

  const now = Date.now();
  const rawEvents: RawEvent[] = parsedEvents.map((e) => ({
    id: e.key,
    type: e.type,
    timestampMs: e.timestampMs,
    lat: e.lat,
    lon: e.lon,
    address: e.address,
    raw: e.raw,
    importedAt: now,
  }));
  await upsertEvents(rawEvents);

  // Koppel over ALLE bekende events (niet alleen deze batch), zodat een
  // eerder losse START alsnog aan een nieuwe STOP kan worden gekoppeld.
  const allEvents = await db.events.toArray();
  const linkable: LinkableEvent[] = allEvents.map((e) => ({
    id: e.id,
    type: e.type,
    timestampMs: e.timestampMs,
    lat: e.lat,
    lon: e.lon,
    address: e.address,
  }));
  const { pairs, orphanStarts, orphanStops } = linkEvents(linkable);

  const existingTrips = await db.trips.toArray();
  const existingStartEventIds = new Set(
    existingTrips.filter((t) => t.startEventId).map((t) => t.startEventId),
  );

  const newPairs = pairs.filter((p) => !existingStartEventIds.has(p.start.id));

  const locations = await db.locations.toArray();
  const pairRules = await db.locationPairRules.toArray();

  let newTripsCount = 0;
  for (const pair of newPairs) {
    const trip = await buildTripFromPair(carId, pair.start, pair.stop, locations, pairRules);
    await db.trips.add(trip);
    newTripsCount++;
  }

  if (newTripsCount > 0) {
    await recalculateCarChain(carId);
  }

  return {
    newTripsCount,
    parseWarnings: warnings,
    orphanStartsCount: orphanStarts.length,
    orphanStopsCount: orphanStops.length,
    skippedDuplicateEvents,
  };
}

async function buildTripFromPair(
  carId: string,
  start: LinkableEvent,
  stop: LinkableEvent,
  locations: Location[],
  pairRules: LocationPairRule[],
): Promise<Trip> {
  const [distance, startAddress, endAddress] = await Promise.all([
    fetchDistanceKm(start.lat, start.lon, stop.lat, stop.lon),
    start.address ? Promise.resolve(start.address) : reverseGeocode(start.lat, start.lon),
    stop.address ? Promise.resolve(stop.address) : reverseGeocode(stop.lat, stop.lon),
  ]);

  const startLocation = matchLocation(start.lat, start.lon, locations);
  const endLocation = matchLocation(stop.lat, stop.lon, locations);
  const rule = findPairRule(startLocation?.id, endLocation?.id, pairRules);

  return {
    id: newId(),
    carId,
    date: isoDateFromMs(start.timestampMs),
    startTimeMs: start.timestampMs,
    endTimeMs: stop.timestampMs,
    startOdometer: 0,
    endOdometer: 0,
    distanceKm: distance.km,
    distanceEstimated: distance.estimated,
    startAddress: startAddress ?? '',
    startLat: start.lat,
    startLon: start.lon,
    endAddress: endAddress ?? '',
    endLat: stop.lat,
    endLon: stop.lon,
    startLocationId: startLocation?.id,
    endLocationId: endLocation?.id,
    routeDeviation: '',
    tripType: rule?.tripType ?? 'zakelijk',
    privateDetourKm: 0,
    description: rule?.description ?? '',
    status: 'te controleren',
    startEventId: start.id,
    stopEventId: stop.id,
    manual: false,
    locked: false,
    changeLog: [
      {
        timestampMs: Date.now(),
        field: 'aangemaakt',
        oldValue: '',
        newValue: 'geïmporteerd uit Rittenlog.txt',
      },
    ],
  };
}

/**
 * Herberekent de kilometerstand-keten voor alle (niet-vergrendelde) ritten
 * van een auto. Vergrendelde ritten (na een ijkpunt) blijven als anker staan.
 */
export async function recalculateCarChain(carId: string): Promise<void> {
  const car = await db.cars.get(carId);
  if (!car) return;
  const trips = await db.trips.where({ carId }).toArray();
  const chainInput: ChainTrip[] = trips.map((t) => ({
    id: t.id,
    startTimeMs: t.startTimeMs,
    distanceKm: t.distanceKm,
    startOdometer: t.startOdometer,
    endOdometer: t.endOdometer,
    locked: t.locked,
  }));
  const recomputed = recomputeChain(chainInput, car.startOdometer);
  await db.trips.bulkPut(
    trips.map((t) => {
      const r = recomputed.find((x) => x.id === t.id)!;
      return { ...t, startOdometer: r.startOdometer, endOdometer: r.endOdometer };
    }),
  );
}

export interface CheckpointResult {
  diffKm: number;
  adjustedTripsCount: number;
}

/**
 * Voegt een ijkpunt toe: verdeelt het verschil tussen de echte tellerstand en
 * de berekende stand proportioneel over de ritten sinds het vorige ijkpunt,
 * en vergrendelt die ritten daarna (worden niet meer automatisch herrekend).
 */
export async function addCheckpointAndApply(
  carId: string,
  date: string,
  odometer: number,
  note: string,
): Promise<CheckpointResult> {
  const car = await db.cars.get(carId);
  if (!car) throw new Error('Auto niet gevonden.');

  const checkpointMs = new Date(`${date}T23:59:59`).getTime();
  const allCheckpoints = await db.checkpoints.where({ carId }).sortBy('date');
  const previousCheckpoints = allCheckpoints.filter((c) => new Date(c.date).getTime() < checkpointMs);
  const previous = previousCheckpoints.at(-1);
  const startOdometer = previous ? previous.odometer : car.startOdometer;
  const rangeStartMs = previous ? new Date(`${previous.date}T00:00:00`).getTime() : -Infinity;

  const allTrips = await db.trips.where({ carId }).toArray();
  const tripsInRange = allTrips.filter(
    (t) => !t.locked && t.startTimeMs >= rangeStartMs && t.startTimeMs <= checkpointMs,
  );

  const chainInput: ChainTrip[] = tripsInRange.map((t) => ({
    id: t.id,
    startTimeMs: t.startTimeMs,
    distanceKm: t.distanceKm,
    startOdometer: t.startOdometer,
    endOdometer: t.endOdometer,
    locked: false,
  }));

  const { trips: adjusted, diffKm } = applyCheckpoint(chainInput, startOdometer, odometer);

  const now = Date.now();
  await db.trips.bulkPut(
    tripsInRange.map((t) => {
      const a = adjusted.find((x) => x.id === t.id)!;
      return {
        ...t,
        startOdometer: a.startOdometer,
        endOdometer: a.endOdometer,
        distanceKm: a.distanceKm,
        locked: true,
        changeLog: [
          ...t.changeLog,
          {
            timestampMs: now,
            field: 'kilometerstand',
            oldValue: `${t.startOdometer}–${t.endOdometer}`,
            newValue: `${a.startOdometer}–${a.endOdometer}`,
            note: `Aangepast door ijkpunt op ${date} (${diffKm >= 0 ? '+' : ''}${diffKm} km verdeeld).`,
          },
        ],
      };
    }),
  );

  const checkpoint: Checkpoint = { id: newId(), carId, date, odometer, note, createdAt: now };
  await db.checkpoints.add(checkpoint);

  // Ritten ná dit ijkpunt (nog niet vergrendeld) opnieuw doorrekenen vanaf de nieuwe stand.
  await recalculateCarChain(carId);

  return { diffKm, adjustedTripsCount: tripsInRange.length };
}

export async function recordTripEdit(
  id: string,
  changes: Partial<Trip>,
  field: string,
  oldValue: string,
  newValue: string,
): Promise<void> {
  const existing = await db.trips.get(id);
  if (!existing) return;
  await db.trips.update(id, {
    ...changes,
    changeLog: [...existing.changeLog, { timestampMs: Date.now(), field, oldValue, newValue }],
  });
  await recalculateCarChain(existing.carId);
}

export async function addManualTrip(trip: Omit<Trip, 'id' | 'changeLog'>): Promise<void> {
  const full: Trip = {
    ...trip,
    id: newId(),
    changeLog: [
      { timestampMs: Date.now(), field: 'aangemaakt', oldValue: '', newValue: 'handmatig toegevoegd' },
    ],
  };
  await db.trips.add(full);
  await recalculateCarChain(trip.carId);
}

export async function removeTrip(id: string): Promise<void> {
  const trip = await db.trips.get(id);
  if (!trip) return;
  await db.trips.delete(id);
  await recalculateCarChain(trip.carId);
}

/** Voegt twee (opeenvolgende) ritten samen tot één rit (bv. na een tankstop). */
export async function mergeTrips(firstId: string, secondId: string): Promise<void> {
  const [first, second] = await Promise.all([db.trips.get(firstId), db.trips.get(secondId)]);
  if (!first || !second) return;

  const merged: Trip = {
    ...first,
    endTimeMs: second.endTimeMs,
    endAddress: second.endAddress,
    endLat: second.endLat,
    endLon: second.endLon,
    endLocationId: second.endLocationId,
    distanceKm: Math.round((first.distanceKm + second.distanceKm) * 10) / 10,
    distanceEstimated: first.distanceEstimated || second.distanceEstimated,
    stopEventId: second.stopEventId,
    description: first.description || second.description,
    routeDeviation: [first.routeDeviation, second.routeDeviation].filter(Boolean).join('; '),
    changeLog: [
      ...first.changeLog,
      ...second.changeLog,
      {
        timestampMs: Date.now(),
        field: 'samengevoegd',
        oldValue: `${first.id} + ${second.id}`,
        newValue: 'één rit',
        note: 'Twee ritten samengevoegd (bv. korte stop zoals tanken).',
      },
    ],
  };

  await db.transaction('rw', db.trips, async () => {
    await db.trips.put(merged);
    await db.trips.delete(second.id);
  });
  await recalculateCarChain(first.carId);
}
