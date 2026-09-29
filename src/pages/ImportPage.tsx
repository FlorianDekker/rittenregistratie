import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { runImport, type ImportSummary } from '../actions';

export default function ImportPage() {
  const cars = useLiveQuery(() => db.cars.toArray());
  const [carId, setCarId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeCarId = carId || cars?.[0]?.id || '';

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeCarId) return;
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const text = await file.text();
      const result = await runImport(activeCarId, text);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout bij importeren.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Import</h1>
      </header>
      <main className="app__main">
        {!cars || cars.length === 0 ? (
          <div className="card">
            <p>Voeg eerst een auto toe voordat je kunt importeren.</p>
            <Link to="/autos" className="btn" style={{ marginTop: 12 }}>
              Auto toevoegen
            </Link>
          </div>
        ) : (
          <>
            <div className="card section">
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

              <p className="helper">
                Kies het bestand <code>Rittenlog.txt</code> uit iCloud Drive → Shortcuts. Het bestand
                mag steeds opnieuw (en groeiend) worden geïmporteerd: eerder ingelezen ritten worden
                niet dubbel aangemaakt.
              </p>

              <input
                ref={fileRef}
                type="file"
                accept=".txt,text/plain"
                onChange={handleFile}
                disabled={busy}
                className="field"
              />
              {busy && <p className="helper">Bezig met importeren…</p>}
            </div>

            {error && (
              <div className="card" style={{ borderColor: 'var(--danger)' }}>
                <p className="badge badge--danger">Fout</p>
                <p>{error}</p>
              </div>
            )}

            {summary && (
              <div className="card section">
                <h2>Resultaat</h2>
                <ul className="log-list" style={{ fontSize: 'var(--fs-body)', color: 'var(--ink)' }}>
                  <li>{summary.newTripsCount} nieuwe rit(ten) aangemaakt (status "te controleren").</li>
                  <li>{summary.skippedDuplicateEvents} event(s) waren al eerder geïmporteerd.</li>
                  {summary.orphanStartsCount > 0 && (
                    <li>
                      ⚠️ {summary.orphanStartsCount} START-event(s) zonder bijbehorende STOP (rit nog niet
                      afgerond, of STOP ontbreekt).
                    </li>
                  )}
                  {summary.orphanStopsCount > 0 && (
                    <li>
                      ⚠️ {summary.orphanStopsCount} STOP-event(s) zonder voorafgaande START.
                    </li>
                  )}
                </ul>

                {summary.parseWarnings.length > 0 && (
                  <div className="section">
                    <h3>Overgeslagen regels</h3>
                    <ul className="warning-list">
                      {summary.parseWarnings.map((w, i) => (
                        <li key={i}>
                          Regel {w.line}: {w.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.newTripsCount > 0 && (
                  <Link to="/ritten" className="btn btn--block">
                    Nieuwe ritten controleren
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        <div className="card">
          <p className="helper">
            Nog geen Opdracht op je iPhone ingesteld? Bekijk de stap-voor-stap instructies op de
            {' '}
            <Link to="/help">Help-pagina</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
