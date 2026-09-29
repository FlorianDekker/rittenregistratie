import { useState } from 'react';
import { formatDateNL, formatNumberNL, formatTimeNL, parseNumberNL } from '../lib/format';
import type { Trip, TripType } from '../types';

export interface TripDraft {
  date: string;
  startTimeMs: number;
  endTimeMs: number;
  startOdometer: number;
  endOdometer: number;
  startAddress: string;
  endAddress: string;
  routeDeviation: string;
  tripType: TripType;
  privateDetourKm: number;
  description: string;
  status: 'te controleren' | 'gecontroleerd';
}

interface Props {
  trip?: Trip;
  mode: 'edit' | 'create';
  onClose: () => void;
  onSave: (draft: TripDraft) => void;
  onDelete?: () => void;
}

function toDraft(trip?: Trip): TripDraft {
  if (trip) {
    return {
      date: trip.date,
      startTimeMs: trip.startTimeMs,
      endTimeMs: trip.endTimeMs,
      startOdometer: trip.startOdometer,
      endOdometer: trip.endOdometer,
      startAddress: trip.startAddress,
      endAddress: trip.endAddress,
      routeDeviation: trip.routeDeviation,
      tripType: trip.tripType,
      privateDetourKm: trip.privateDetourKm,
      description: trip.description,
      status: trip.status,
    };
  }
  const now = Date.now();
  return {
    date: new Date(now).toISOString().slice(0, 10),
    startTimeMs: now,
    endTimeMs: now,
    startOdometer: 0,
    endOdometer: 0,
    startAddress: '',
    endAddress: '',
    routeDeviation: '',
    tripType: 'zakelijk',
    privateDetourKm: 0,
    description: '',
    status: 'gecontroleerd',
  };
}

function dateTimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TripSheet({ trip, mode, onClose, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<TripDraft>(() => toDraft(trip));

  const locked = trip?.locked ?? false;

  function update<K extends keyof TripDraft>(key: K, value: TripDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(draft);
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="sheet__header">
          <h2>{mode === 'create' ? 'Rit toevoegen' : 'Rit bewerken'}</h2>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Sluiten">
            ✕
          </button>
        </div>

        {locked && (
          <p className="helper">
            Deze rit is vergrendeld door een ijkpunt. Kilometerstanden zijn niet meer automatisch
            aan te passen; overige velden wel.
          </p>
        )}

        <div className="form-grid">
          {mode === 'create' ? (
            <>
              <label>
                Vertrek (datum &amp; tijd)
                <input
                  className="field"
                  type="datetime-local"
                  value={dateTimeLocalValue(draft.startTimeMs)}
                  onChange={(e) => {
                    const ms = new Date(e.target.value).getTime();
                    update('startTimeMs', ms);
                    update('date', e.target.value.slice(0, 10));
                  }}
                  required
                />
              </label>
              <label>
                Aankomst (datum &amp; tijd)
                <input
                  className="field"
                  type="datetime-local"
                  value={dateTimeLocalValue(draft.endTimeMs)}
                  onChange={(e) => update('endTimeMs', new Date(e.target.value).getTime())}
                  required
                />
              </label>
            </>
          ) : (
            <p className="helper">
              {formatDateNL(draft.startTimeMs)} · {formatTimeNL(draft.startTimeMs)}–
              {formatTimeNL(draft.endTimeMs)}
            </p>
          )}

          <label>
            Vertrekadres
            <input
              className="field"
              value={draft.startAddress}
              onChange={(e) => update('startAddress', e.target.value)}
              placeholder="Straat, postcode, plaats"
            />
          </label>
          <label>
            Aankomstadres
            <input
              className="field"
              value={draft.endAddress}
              onChange={(e) => update('endAddress', e.target.value)}
              placeholder="Straat, postcode, plaats"
            />
          </label>

          <div className="form-row">
            <label>
              Beginstand (km)
              <input
                className="field"
                type="text"
                inputMode="decimal"
                disabled={locked}
                value={formatNumberNL(draft.startOdometer)}
                onChange={(e) => update('startOdometer', parseNumberNL(e.target.value) || 0)}
              />
            </label>
            <label>
              Eindstand (km)
              <input
                className="field"
                type="text"
                inputMode="decimal"
                disabled={locked}
                value={formatNumberNL(draft.endOdometer)}
                onChange={(e) => update('endOdometer', parseNumberNL(e.target.value) || 0)}
              />
            </label>
          </div>

          <label>
            Afwijkende route (t.o.v. gebruikelijke route)
            <textarea
              className="field"
              value={draft.routeDeviation}
              onChange={(e) => update('routeDeviation', e.target.value)}
              placeholder="Bijv. omleiding via A2 i.v.m. werkzaamheden"
            />
          </label>

          <label>
            Omschrijving / doel (klant, afspraak, woon-werk, ...)
            <input
              className="field"
              value={draft.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </label>

          <label>
            Soort rit
            <div className="type-toggle" role="group" aria-label="Soort rit">
              <button
                type="button"
                className="type-toggle__zakelijk"
                aria-pressed={draft.tripType === 'zakelijk'}
                onClick={() => update('tripType', 'zakelijk')}
              >
                Zakelijk
              </button>
              <button
                type="button"
                className="type-toggle__prive"
                aria-pressed={draft.tripType === 'privé'}
                onClick={() => update('tripType', 'privé')}
              >
                Privé
              </button>
            </div>
          </label>

          <label>
            Privé-omrijkilometers (bij gemengde rit)
            <input
              className="field"
              type="text"
              inputMode="decimal"
              value={formatNumberNL(draft.privateDetourKm)}
              onChange={(e) => update('privateDetourKm', parseNumberNL(e.target.value) || 0)}
            />
          </label>

          <label>
            Status
            <div className="type-toggle" role="group" aria-label="Status">
              <button
                type="button"
                aria-pressed={draft.status === 'te controleren'}
                onClick={() => update('status', 'te controleren')}
              >
                Te controleren
              </button>
              <button
                type="button"
                aria-pressed={draft.status === 'gecontroleerd'}
                onClick={() => update('status', 'gecontroleerd')}
              >
                Gecontroleerd
              </button>
            </div>
          </label>
        </div>

        {trip && trip.changeLog.length > 0 && (
          <div className="section">
            <h3>Wijzigingslog</h3>
            <ul className="log-list">
              {trip.changeLog
                .slice()
                .reverse()
                .map((entry, i) => (
                  <li key={i}>
                    {formatDateNL(entry.timestampMs)} {formatTimeNL(entry.timestampMs)} — {entry.field}
                    {entry.oldValue || entry.newValue ? `: "${entry.oldValue}" → "${entry.newValue}"` : ''}
                    {entry.note ? ` (${entry.note})` : ''}
                  </li>
                ))}
            </ul>
          </div>
        )}

        <div className="form-grid">
          <button type="submit" className="btn btn--block">
            Opslaan
          </button>
          {onDelete && (
            <button type="button" className="btn btn--danger btn--block" onClick={onDelete}>
              Rit verwijderen
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
