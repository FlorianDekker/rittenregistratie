import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { addManualTrip, mergeTrips, recordTripEdit, removeTrip } from '../actions';
import { suggestMerges } from '../lib/merge';
import { formatNumberNL } from '../lib/format';
import TripCard from '../components/TripCard';
import TripSheet, { type TripDraft } from '../components/TripSheet';
import type { Trip } from '../types';

const MONTH_NAMES = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

export default function Trips() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth()); // 0-11
  const [editing, setEditing] = useState<Trip | 'new' | null>(null);

  const cars = useLiveQuery(() => db.cars.toArray());
  const allTrips = useLiveQuery(() => db.trips.orderBy('startTimeMs').toArray());

  const tripsThisMonth = useMemo(() => {
    if (!allTrips) return [];
    return allTrips.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [allTrips, year, month]);

  const mergeSuggestions = useMemo(() => {
    if (tripsThisMonth.length < 2) return [];
    return suggestMerges(
      tripsThisMonth.map((t) => ({
        id: t.id,
        endTimeMs: t.endTimeMs,
        endLat: t.endLat,
        endLon: t.endLon,
        startTimeMs: t.startTimeMs,
        startLat: t.startLat,
        startLon: t.startLon,
      })),
    );
  }, [tripsThisMonth]);

  function goMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  }

  async function handleToggleType(trip: Trip) {
    const nieuw = trip.tripType === 'zakelijk' ? 'privé' : 'zakelijk';
    await recordTripEdit(trip.id, { tripType: nieuw }, 'soort', trip.tripType, nieuw);
  }

  async function handleSave(draft: TripDraft) {
    if (editing === 'new') {
      const carId = cars?.[0]?.id;
      if (!carId) return;
      await addManualTrip({
        carId,
        date: draft.date,
        startTimeMs: draft.startTimeMs,
        endTimeMs: draft.endTimeMs,
        startOdometer: draft.startOdometer,
        endOdometer: draft.endOdometer || draft.startOdometer,
        distanceKm: Math.max(0, Math.round((draft.endOdometer - draft.startOdometer) * 10) / 10),
        distanceEstimated: false,
        startAddress: draft.startAddress,
        startLat: 0,
        startLon: 0,
        endAddress: draft.endAddress,
        endLat: 0,
        endLon: 0,
        routeDeviation: draft.routeDeviation,
        tripType: draft.tripType,
        privateDetourKm: draft.privateDetourKm,
        description: draft.description,
        status: draft.status,
        manual: true,
        locked: false,
      });
    } else if (editing) {
      const changes: Partial<Trip> = {
        startAddress: draft.startAddress,
        endAddress: draft.endAddress,
        routeDeviation: draft.routeDeviation,
        tripType: draft.tripType,
        privateDetourKm: draft.privateDetourKm,
        description: draft.description,
        status: draft.status,
      };
      if (!editing.locked) {
        changes.startOdometer = draft.startOdometer;
        changes.endOdometer = draft.endOdometer;
        changes.distanceKm = Math.max(0, Math.round((draft.endOdometer - draft.startOdometer) * 10) / 10);
      }
      await recordTripEdit(editing.id, changes, 'bewerkt', '', 'handmatig aangepast');
    }
    setEditing(null);
  }

  async function handleDelete() {
    if (editing && editing !== 'new') {
      await removeTrip(editing.id);
    }
    setEditing(null);
  }

  async function handleMerge(firstId: string, secondId: string) {
    await mergeTrips(firstId, secondId);
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Ritten</h1>
        <button type="button" className="btn btn--sm" onClick={() => setEditing('new')}>
          + Rit
        </button>
      </header>
      <main className="app__main">
        <div className="month-nav">
          <button type="button" className="icon-btn" onClick={() => goMonth(-1)} aria-label="Vorige maand">
            ‹
          </button>
          <span className="month-nav__label">
            {MONTH_NAMES[month]} {year}
          </span>
          <button type="button" className="icon-btn" onClick={() => goMonth(1)} aria-label="Volgende maand">
            ›
          </button>
        </div>

        {mergeSuggestions.length > 0 && (
          <div className="section">
            <h3>Suggesties</h3>
            {mergeSuggestions.map((s) => {
              const a = tripsThisMonth.find((t) => t.id === s.firstTripId);
              const b = tripsThisMonth.find((t) => t.id === s.secondTripId);
              if (!a || !b) return null;
              return (
                <div className="merge-suggestion" key={`${s.firstTripId}-${s.secondTripId}`}>
                  <span>
                    Korte stop ({s.gapMinutes} min) tussen "{a.endAddress || 'onbekend'}" en "
                    {b.startAddress || 'onbekend'}" — lijkt op een tankstop. Samenvoegen tot één rit?
                  </span>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() => handleMerge(s.firstTripId, s.secondTripId)}
                  >
                    Ritten samenvoegen
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="section">
          {tripsThisMonth.length === 0 && (
            <div className="empty-state">
              <p>Nog geen ritten in {MONTH_NAMES[month]} {year}.</p>
            </div>
          )}
          {tripsThisMonth.map((trip) => (
            <TripCard key={trip.id} trip={trip} onToggleType={handleToggleType} onOpen={setEditing} />
          ))}
        </div>

        {tripsThisMonth.length > 0 && (
          <div className="card card--tight helper">
            {tripsThisMonth.length} ritten · zakelijk{' '}
            {formatNumberNL(
              tripsThisMonth.filter((t) => t.tripType === 'zakelijk').reduce((s, t) => s + t.distanceKm, 0),
            )}{' '}
            km · privé{' '}
            {formatNumberNL(
              tripsThisMonth
                .filter((t) => t.tripType === 'privé')
                .reduce((s, t) => s + t.distanceKm + t.privateDetourKm, 0),
            )}{' '}
            km
          </div>
        )}
      </main>

      {editing && (
        <TripSheet
          trip={editing === 'new' ? undefined : editing}
          mode={editing === 'new' ? 'create' : 'edit'}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={editing !== 'new' ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
