// Centrale domeintypes voor Rittenregistratie.

export type TripType = 'zakelijk' | 'privé';

export type TripStatus = 'te controleren' | 'gecontroleerd';

export interface Car {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  /** ISO-datum (jjjj-mm-dd) waarop het gebruik van deze auto begint. */
  periodStart: string;
  /** ISO-datum (jjjj-mm-dd), leeg = nog in gebruik. */
  periodEnd: string;
  /** Kilometerstand bij start van de gebruiksperiode. */
  startOdometer: number;
}

/** Eén START of STOP event zoals geïmporteerd uit Rittenlog.txt. */
export interface RawEvent {
  /** Dedup-sleutel: `${type}|${timestampMs}`. */
  id: string;
  type: 'START' | 'STOP';
  timestampMs: number;
  lat: number;
  lon: number;
  address: string;
  raw: string;
  importedAt: number;
}

export interface ChangeLogEntry {
  timestampMs: number;
  field: string;
  oldValue: string;
  newValue: string;
  note?: string;
}

export interface Trip {
  id: string;
  carId: string;
  /** ISO-datum jjjj-mm-dd van vertrek. */
  date: string;
  startTimeMs: number;
  endTimeMs: number;
  startOdometer: number;
  endOdometer: number;
  distanceKm: number;
  /** true als de afstand een schatting is (hemelsbreed × 1,25) i.p.v. OSRM-route. */
  distanceEstimated: boolean;
  startAddress: string;
  startLat: number;
  startLon: number;
  endAddress: string;
  endLat: number;
  endLon: number;
  /** Vaste locatie-labels indien binnen straal van een bekende locatie. */
  startLocationId?: string;
  endLocationId?: string;
  /** Afwijkende route t.o.v. de gebruikelijke, indien van toepassing. */
  routeDeviation: string;
  tripType: TripType;
  /** Privé-omrijkilometers bij een gemengde rit. */
  privateDetourKm: number;
  /** Omschrijving / doel (klant, afspraak, "woon-werk" e.d.). */
  description: string;
  status: TripStatus;
  /** Gekoppelde event-id's (indien uit import), voor traceerbaarheid. */
  startEventId?: string;
  stopEventId?: string;
  /** true = handmatig toegevoegd (geen gekoppelde events). */
  manual: boolean;
  /** Kilometerstanden zijn "bevroren" door een ijkpunt vóór deze rit. */
  locked: boolean;
  changeLog: ChangeLogEntry[];
}

export interface Location {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Straal in meters waarbinnen een rit dit label krijgt. */
  radiusM: number;
}

export interface LocationPairRule {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  tripType: TripType;
  description: string;
}

/** IJkpunt: een door de gebruiker ingevoerde, echte tellerstand. */
export interface Checkpoint {
  id: string;
  carId: string;
  /** ISO-datum jjjj-mm-dd. */
  date: string;
  odometer: number;
  note: string;
  createdAt: number;
}
