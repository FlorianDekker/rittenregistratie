import Dexie, { type EntityTable } from 'dexie';
import type { Car, Checkpoint, ChangeLogEntry, Location, LocationPairRule, RawEvent, Trip } from './types';

// Lokale IndexedDB-database voor de rittenregistratie. Alles blijft op het
// apparaat van de gebruiker; er is geen server.
export const db = new Dexie('RittenregistratieDB') as Dexie & {
  cars: EntityTable<Car, 'id'>;
  events: EntityTable<RawEvent, 'id'>;
  trips: EntityTable<Trip, 'id'>;
  locations: EntityTable<Location, 'id'>;
  locationPairRules: EntityTable<LocationPairRule, 'id'>;
  checkpoints: EntityTable<Checkpoint, 'id'>;
};

db.version(1).stores({
  cars: 'id, periodStart',
  // events.id = dedup-sleutel `${type}|${timestampMs}`: bulkPut is daarmee
  // idempotent, ook als hetzelfde (groeiende) bestand opnieuw wordt geïmporteerd.
  events: 'id, timestampMs, type',
  trips: 'id, carId, date, startTimeMs, status',
  locations: 'id, name',
  locationPairRules: 'id, fromLocationId, toLocationId',
  checkpoints: 'id, carId, date',
});

export function newId(): string {
  return crypto.randomUUID();
}

// --- Auto's ---

export async function addCar(car: Car): Promise<void> {
  await db.cars.add(car);
}

export async function updateCar(id: string, changes: Partial<Car>): Promise<void> {
  await db.cars.update(id, changes);
}

export async function deleteCar(id: string): Promise<void> {
  await db.cars.delete(id);
}

// --- Events (ruwe import-regels) ---

/** Slaat events idempotent op: bestaande id's (zelfde tijdstempel+type) worden overschreven. */
export async function upsertEvents(events: RawEvent[]): Promise<void> {
  await db.events.bulkPut(events);
}

// --- Ritten ---

export async function addTrip(trip: Trip): Promise<void> {
  await db.trips.add(trip);
}

export async function updateTrip(
  id: string,
  changes: Partial<Trip>,
  logEntry?: Omit<ChangeLogEntry, 'timestampMs'>,
): Promise<void> {
  const existing = await db.trips.get(id);
  if (!existing) return;
  const changeLog = [...existing.changeLog];
  if (logEntry) {
    changeLog.push({ ...logEntry, timestampMs: Date.now() });
  }
  await db.trips.update(id, { ...changes, changeLog });
}

export async function deleteTrip(id: string): Promise<void> {
  await db.trips.delete(id);
}

// --- Vaste locaties ---

export async function addLocation(location: Location): Promise<void> {
  await db.locations.add(location);
}

export async function updateLocation(id: string, changes: Partial<Location>): Promise<void> {
  await db.locations.update(id, changes);
}

export async function deleteLocation(id: string): Promise<void> {
  await db.locations.delete(id);
  await db.locationPairRules.where({ fromLocationId: id }).delete();
  await db.locationPairRules.where({ toLocationId: id }).delete();
}

export async function addLocationPairRule(rule: LocationPairRule): Promise<void> {
  await db.locationPairRules.add(rule);
}

export async function deleteLocationPairRule(id: string): Promise<void> {
  await db.locationPairRules.delete(id);
}

// --- IJkpunten ---

export async function addCheckpoint(checkpoint: Checkpoint): Promise<void> {
  await db.checkpoints.add(checkpoint);
}

export async function deleteCheckpoint(id: string): Promise<void> {
  await db.checkpoints.delete(id);
}

// --- Back-up: volledige export & import ---

export interface BackupData {
  version: 1;
  exportedAt: number;
  cars: Car[];
  events: RawEvent[];
  trips: Trip[];
  locations: Location[];
  locationPairRules: LocationPairRule[];
  checkpoints: Checkpoint[];
}

export async function exportBackupJson(): Promise<string> {
  const [cars, events, trips, locations, locationPairRules, checkpoints] = await Promise.all([
    db.cars.toArray(),
    db.events.toArray(),
    db.trips.toArray(),
    db.locations.toArray(),
    db.locationPairRules.toArray(),
    db.checkpoints.toArray(),
  ]);
  const data: BackupData = {
    version: 1,
    exportedAt: Date.now(),
    cars,
    events,
    trips,
    locations,
    locationPairRules,
    checkpoints,
  };
  return JSON.stringify(data, null, 2);
}

export async function importBackupJson(json: string): Promise<void> {
  const data = JSON.parse(json) as Partial<BackupData>;
  await db.transaction(
    'rw',
    [db.cars, db.events, db.trips, db.locations, db.locationPairRules, db.checkpoints],
    async () => {
      if (Array.isArray(data.cars)) await db.cars.bulkPut(data.cars);
      if (Array.isArray(data.events)) await db.events.bulkPut(data.events);
      if (Array.isArray(data.trips)) await db.trips.bulkPut(data.trips);
      if (Array.isArray(data.locations)) await db.locations.bulkPut(data.locations);
      if (Array.isArray(data.locationPairRules)) await db.locationPairRules.bulkPut(data.locationPairRules);
      if (Array.isArray(data.checkpoints)) await db.checkpoints.bulkPut(data.checkpoints);
    },
  );
}

export async function clearAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.cars, db.events, db.trips, db.locations, db.locationPairRules, db.checkpoints],
    async () => {
      await Promise.all([
        db.cars.clear(),
        db.events.clear(),
        db.trips.clear(),
        db.locations.clear(),
        db.locationPairRules.clear(),
        db.checkpoints.clear(),
      ]);
    },
  );
}
