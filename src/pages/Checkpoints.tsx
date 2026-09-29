import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, deleteCheckpoint } from '../db';
import { addCheckpointAndApply, recalculateCarChain } from '../actions';
import { formatDateNL, formatNumberNL, parseNumberNL } from '../lib/format';

export default function Checkpoints() {
  const cars = useLiveQuery(() => db.cars.toArray());
  const checkpoints = useLiveQuery(() => db.checkpoints.orderBy('date').reverse().toArray());

  const [carId, setCarId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [odometer, setOdometer] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<{ diffKm: number; adjustedTripsCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeCarId = carId || cars?.[0]?.id || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const value = parseNumberNL(odometer);
    if (!activeCarId || Number.isNaN(value)) {
      setError('Vul een geldige tellerstand in.');
      return;
    }
    try {
      const r = await addCheckpointAndApply(activeCarId, date, value, note);
      setResult(r);
      setOdometer('');
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout.');
    }
  }

  async function handleDelete(id: string, carIdOfCheckpoint: string) {
    if (!confirm('IJkpunt verwijderen? De eerder vergrendelde ritten blijven vergrendeld staan.')) return;
    await deleteCheckpoint(id);
    await recalculateCarChain(carIdOfCheckpoint);
  }

  function carLabel(id: string): string {
    const c = cars?.find((x) => x.id === id);
    return c ? `${c.brand} ${c.model} (${c.licensePlate})` : '—';
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>IJkpunten</h1>
      </header>
      <main className="app__main">
        <p className="helper">
          Voer bij een tankbeurt of controle de echte tellerstand in. Het verschil met de berekende
          stand wordt evenredig verdeeld over de ritten sinds het vorige ijkpunt. Die ritten worden
          daarna vergrendeld en niet meer automatisch herrekend.
        </p>

        {(!cars || cars.length === 0) ? (
          <p className="helper">Voeg eerst een auto toe.</p>
        ) : (
          <form className="card form-grid" onSubmit={handleSubmit}>
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
            <div className="form-row">
              <label>
                Datum
                <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label>
                Echte tellerstand (km)
                <input
                  className="field"
                  type="text"
                  inputMode="decimal"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  placeholder="bijv. 12345,6"
                  required
                />
              </label>
            </div>
            <label>
              Notitie (optioneel)
              <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Getankt bij Shell" />
            </label>
            <button type="submit" className="btn">
              IJkpunt toepassen
            </button>
            {error && <p className="helper" style={{ color: 'var(--danger)' }}>{error}</p>}
            {result && (
              <p className="helper">
                Verschil: {result.diffKm >= 0 ? '+' : ''}
                {formatNumberNL(result.diffKm)} km verdeeld over {result.adjustedTripsCount} rit(ten).
              </p>
            )}
          </form>
        )}

        <div className="section">
          <h2>Eerdere ijkpunten</h2>
          {checkpoints?.length === 0 && <p className="helper">Nog geen ijkpunten ingevoerd.</p>}
          {checkpoints?.map((cp) => (
            <div className="card trip-card__top" key={cp.id}>
              <div>
                <h3>{formatNumberNL(cp.odometer)} km</h3>
                <p className="helper">
                  {formatDateNL(new Date(cp.date).getTime())} · {carLabel(cp.carId)}
                  {cp.note ? ` · ${cp.note}` : ''}
                </p>
              </div>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleDelete(cp.id, cp.carId)}>
                Verwijderen
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
