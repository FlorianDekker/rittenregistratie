import { formatNumberNL, formatTimeNL } from '../lib/format';
import type { Trip } from '../types';

// "di 22 sep" — past op één regel naast de zakelijk/privé-knop.
const shortDate = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });

interface Props {
  trip: Trip;
  onToggleType: (trip: Trip) => void;
  onOpen: (trip: Trip) => void;
}

export default function TripCard({ trip, onToggleType, onOpen }: Props) {
  return (
    <div className="trip-card">
      <div className="trip-card__top">
        <button type="button" className="btn--ghost trip-card__when" onClick={() => onOpen(trip)}>
          <span className="trip-card__date">{shortDate.format(trip.startTimeMs)}</span>
          <span className="trip-card__time">
            {formatTimeNL(trip.startTimeMs)}–{formatTimeNL(trip.endTimeMs)}
          </span>
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

      <button type="button" className="trip-card__route" onClick={() => onOpen(trip)}>
        <span className="trip-card__stop">
          <span className="trip-card__dot" aria-hidden="true" />
          {trip.startAddress || '(onbekend adres)'}
        </span>
        <span className="trip-card__stop">
          <span className="trip-card__dot trip-card__dot--end" aria-hidden="true" />
          {trip.endAddress || '(onbekend adres)'}
        </span>
      </button>

      {trip.description && <p className="helper">{trip.description}</p>}

      <div className="trip-card__meta">
        <span>
          {formatNumberNL(trip.distanceKm)} km{trip.distanceEstimated ? ' (schatting)' : ''}
          {trip.privateDetourKm > 0 ? ` · ${formatNumberNL(trip.privateDetourKm)} km omrij` : ''}
        </span>
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {trip.status === 'te controleren' && <span className="badge badge--warn">Te controleren</span>}
          {trip.locked && <span className="badge badge--ok">IJkpunt</span>}
        </span>
      </div>
    </div>
  );
}
