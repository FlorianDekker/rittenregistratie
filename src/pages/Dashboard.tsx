import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { formatDateNL, formatNumberNL } from '../lib/format';
import ProgressBar from '../components/ProgressBar';

const PRIVE_LIMIET = 500;
const PRIVE_WAARSCHUWING = 400;

export default function Dashboard() {
  const trips = useLiveQuery(() => db.trips.toArray());
  const checkpoints = useLiveQuery(() => db.checkpoints.orderBy('date').toArray());
  const cars = useLiveQuery(() => db.cars.toArray());

  const year = useMemo(() => new Date().getFullYear(), []);

  const stats = useMemo(() => {
    if (!trips) return null;
    const tripsThisYear = trips.filter((t) => new Date(t.date).getFullYear() === year);
    const priveKm = tripsThisYear
      .filter((t) => t.tripType === 'privé')
      .reduce((sum, t) => sum + t.distanceKm + t.privateDetourKm, 0);
    const zakelijkKm = tripsThisYear
      .filter((t) => t.tripType === 'zakelijk')
      .reduce((sum, t) => sum + t.distanceKm, 0);
    const teControleren = trips.filter((t) => t.status === 'te controleren').length;
    return { priveKm, zakelijkKm, teControleren, aantalRittenJaar: tripsThisYear.length };
  }, [trips, year]);

  const laatsteIjkpunt = checkpoints?.at(-1);

  if (!stats || !trips) {
    return (
      <div className="app">
        <header className="app__header">
          <h1>Rittenregistratie</h1>
        </header>
        <main className="app__main">
          <p className="helper">Laden…</p>
        </main>
      </div>
    );
  }

  const hasCar = (cars?.length ?? 0) > 0;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Overzicht</h1>
      </header>
      <main className="app__main">
        {!hasCar && (
          <div className="card">
            <p>Je hebt nog geen auto toegevoegd.</p>
            <Link to="/autos" className="btn" style={{ marginTop: 12 }}>
              Auto toevoegen
            </Link>
          </div>
        )}

        <div className="card section">
          <div className="section__title">
            <h2>Privé-kilometers {year}</h2>
            <span className="helper">
              {formatNumberNL(stats.priveKm)} / {PRIVE_LIMIET} km
            </span>
          </div>
          <ProgressBar
            value={stats.priveKm}
            max={PRIVE_LIMIET}
            warnAt={PRIVE_WAARSCHUWING}
            dangerAt={PRIVE_LIMIET}
          />
          <p className="helper">
            Wettelijke grens voor bijtelling-vrij privégebruik: max. 500 km per kalenderjaar (incl.
            privé-omrijkilometers).
          </p>
        </div>

        <div className="stat-grid">
          <div className="stat-tile">
            <span className="stat-tile__value">{formatNumberNL(stats.zakelijkKm)}</span>
            <span className="stat-tile__label">Zakelijke km ({year})</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">{stats.teControleren}</span>
            <span className="stat-tile__label">Ritten te controleren</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">{stats.aantalRittenJaar}</span>
            <span className="stat-tile__label">Ritten dit jaar</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">
              {laatsteIjkpunt ? formatDateNL(new Date(laatsteIjkpunt.date).getTime()) : '—'}
            </span>
            <span className="stat-tile__label">Laatste ijkpunt</span>
          </div>
        </div>

        {stats.teControleren > 0 && (
          <Link to="/ritten" className="btn btn--block">
            {stats.teControleren} rit{stats.teControleren === 1 ? '' : 'ten'} controleren
          </Link>
        )}
      </main>
    </div>
  );
}
