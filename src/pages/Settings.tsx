import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { clearAllData, exportBackupJson, importBackupJson } from '../db';

export default function Settings() {
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const json = await exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rittenregistratie-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importBackupJson(text);
      setMessage('Back-up geïmporteerd.');
    } catch (err) {
      setMessage(err instanceof Error ? `Fout bij importeren: ${err.message}` : 'Fout bij importeren.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleReset() {
    if (!confirm('Alle gegevens verwijderen? Dit kan niet ongedaan worden gemaakt (maak eerst een back-up).')) {
      return;
    }
    await clearAllData();
    setMessage('Alle gegevens zijn verwijderd.');
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Instellingen</h1>
      </header>
      <main className="app__main">
        <div className="card section">
          <h2>Back-up</h2>
          <p className="helper">
            Alle gegevens (auto&apos;s, ritten, locaties, ijkpunten) staan lokaal op dit toestel. Maak
            regelmatig een back-up, bijvoorbeeld vóór een software-update.
          </p>
          <button type="button" className="btn" onClick={handleExport}>
            Back-up exporteren (JSON)
          </button>
          <label>
            Back-up importeren
            <input ref={fileRef} type="file" accept=".json,application/json" className="field" onChange={handleImport} />
          </label>
          {message && <p className="helper">{message}</p>}
        </div>

        <div className="card section">
          <h2>Help</h2>
          <p className="helper">Instructies voor de iPhone-automatisering en importeren.</p>
          <Link to="/help" className="btn btn--secondary">
            Bekijk Help-pagina
          </Link>
        </div>

        <div className="card section">
          <h2>Gevaarlijke zone</h2>
          <p className="helper">Verwijdert alle gegevens van dit toestel.</p>
          <button type="button" className="btn btn--danger" onClick={handleReset}>
            Alle gegevens wissen
          </button>
        </div>
      </main>
    </div>
  );
}
