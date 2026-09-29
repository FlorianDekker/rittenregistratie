import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { buildCsv } from '../lib/csv';

const MONTH_NAMES = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

export default function ExportPage() {
  const cars = useLiveQuery(() => db.cars.toArray());
  const allTrips = useLiveQuery(() => db.trips.toArray());

  const [carId, setCarId] = useState('');
  const [scope, setScope] = useState<'jaar' | 'maand'>('jaar');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());

  const activeCarId = carId || cars?.[0]?.id || '';

  function download() {
    const car = cars?.find((c) => c.id === activeCarId);
    if (!car || !allTrips) return;

    const tripsForCar = allTrips.filter((t) => t.carId === activeCarId);
    const filtered = tripsForCar.filter((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() !== year) return false;
      if (scope === 'maand' && d.getMonth() !== month) return false;
      return true;
    });

    const periodLabel = scope === 'jaar' ? `${year}` : `${MONTH_NAMES[month]} ${year}`;
    const csv = buildCsv(car, filtered, periodLabel);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rittenregistratie-${car.licensePlate}-${scope === 'jaar' ? year : `${year}-${String(month + 1).padStart(2, '0')}`}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Export</h1>
      </header>
      <main className="app__main">
        {(!cars || cars.length === 0) ? (
          <p className="helper">Voeg eerst een auto toe.</p>
        ) : (
          <div className="card form-grid">
            <label>
              Auto
              <select className="field" value={activeCarId} onChange={(e) => setCarId(e.target.value)}>
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.brand} {c.model} — {c.licensePlate}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Periode
              <div className="type-toggle" role="group">
                <button type="button" aria-pressed={scope === 'jaar'} onClick={() => setScope('jaar')}>
                  Per jaar
                </button>
                <button type="button" aria-pressed={scope === 'maand'} onClick={() => setScope('maand')}>
                  Per maand
                </button>
              </div>
            </label>

            <div className="form-row">
              <label>
                Jaar
                <input
                  className="field"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </label>
              {scope === 'maand' && (
                <label>
                  Maand
                  <select className="field" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                    {MONTH_NAMES.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <button type="button" className="btn" onClick={download}>
              CSV downloaden
            </button>
            <p className="helper">
              UTF-8 met BOM, kolommen gescheiden door ';', Nederlandse komma-decimalen en datum
              dd-mm-jjjj. Geschikt om aan te leveren bij een controle door de Belastingdienst.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
