import { formatDateNL, formatNumberNL, formatTimeNL } from '../lib/format';
import type { Trip } from '../types';

interface Props {
  trip: Trip;
  onToggleType: (trip: Trip) => void;
  onOpen: (trip: Trip) => void;
}

export default function TripCard({ trip, onToggleType, onOpen }: Props) {
  return (
    <div className="trip-card">
      <div className="trip-card__top">
        <button type="button" className="btn--ghost" style={{ fontWeight: 700 }} onClick={() => onOpen(trip)}>
          {formatDateNL(trip.startTimeMs)} · {formatTimeNL(trip.startTimeMs)}–{formatTimeNL(trip.endTimeMs)}
        </button>
        <div className="type-toggle" role="group" aria-label="Soort rit">
          <button
            type="button"
            className="type-toggle__zakelijk"
            aria-pressed={trip.tripType === 'zakelijk'}
            onClick={() => trip.tripType !== 'zakelijk' && onToggleType(trip)}
          >
            Zakelijk
          </button>
          <button
            type="button"
            className="type-toggle__prive"
            aria-pressed={trip.tripType === 'privé'}
            onClick={() => trip.tripType !== 'privé' && onToggleType(trip)}
          >
            Privé
          </button>
        </div>
      </div>

      <button type="button" className="trip-card__route" onClick={() => onOpen(trip)} style={{ textAlign: 'left' }}>
        <span>{trip.startAddress || '(onbekend adres)'}</span>
        <span aria-hidden="true">→</span>
        <span>{trip.endAddress || '(onbekend adres)'}</span>
      </button>

      {trip.description && <p className="helper">{trip.description}</p>}

      <div className="trip-card__meta">
        <span>
          {formatNumberNL(trip.distanceKm)} km{trip.distanceEstimated ? ' (schatting)' : ''}
          {trip.privateDetourKm > 0 ? ` · ${formatNumberNL(trip.privateDetourKm)} km omrij` : ''}
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          {trip.status === 'te controleren' && <span className="badge badge--warn">Te controleren</span>}
          {trip.locked && <span className="badge badge--ok">IJkpunt</span>}
        </span>
      </div>
    </div>
  );
}
