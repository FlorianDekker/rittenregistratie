import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  newId,
  addLocation,
  updateLocation,
  deleteLocation,
  addLocationPairRule,
  deleteLocationPairRule,
} from '../db';
import { parseNumberNL } from '../lib/format';
import type { Location, TripType } from '../types';

const emptyLocationForm = { name: '', lat: '', lon: '', radiusM: '200' };

export default function Locations() {
  const locations = useLiveQuery(() => db.locations.toArray());
  const rules = useLiveQuery(() => db.locationPairRules.toArray());

  const [form, setForm] = useState(emptyLocationForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [ruleForm, setRuleForm] = useState({
    fromLocationId: '',
    toLocationId: '',
    tripType: 'zakelijk' as TripType,
    description: 'woon-werk',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const location: Location = {
      id: editingId ?? newId(),
      name: form.name.trim(),
      lat: parseNumberNL(form.lat),
      lon: parseNumberNL(form.lon),
      radiusM: parseNumberNL(form.radiusM) || 200,
    };
    if (editingId) {
      await updateLocation(editingId, location);
    } else {
      await addLocation(location);
    }
    setForm(emptyLocationForm);
    setEditingId(null);
  }

  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  function fillCurrentPosition() {
    if (!navigator.geolocation) {
      setLocateError('Locatie is niet beschikbaar in deze browser.');
      return;
    }
    setLocating(true);
    setLocateError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(5),
          lon: pos.coords.longitude.toFixed(5),
        }));
        setLocating(false);
      },
      () => {
        setLocateError('Kon je locatie niet bepalen. Geef de app toegang tot je locatie.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function startEdit(loc: Location) {
    setEditingId(loc.id);
    setForm({ name: loc.name, lat: String(loc.lat), lon: String(loc.lon), radiusM: String(loc.radiusM) });
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    if (!ruleForm.fromLocationId || !ruleForm.toLocationId) return;
    await addLocationPairRule({ id: newId(), ...ruleForm });
    setRuleForm({ fromLocationId: '', toLocationId: '', tripType: 'zakelijk', description: 'woon-werk' });
  }

  function locationName(id: string): string {
    return locations?.find((l) => l.id === id)?.name ?? '(verwijderd)';
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Vaste locaties</h1>
      </header>
      <main className="app__main">
        <p className="helper">
          Geef veelgebruikte plekken een label (bijv. Thuis, Kantoor, Klant X). Ritten die binnen de
          straal beginnen of eindigen krijgen automatisch dat label.
        </p>

        <form className="card form-grid" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Locatie bewerken' : 'Locatie toevoegen'}</h2>
          <label>
            Label
            <input
              className="field"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Thuis"
              required
            />
          </label>
          <div className="form-row">
            <label>
              Breedtegraad
              <input
                className="field"
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                placeholder="52,0907"
                required
              />
            </label>
            <label>
              Lengtegraad
              <input
                className="field"
                value={form.lon}
                onChange={(e) => setForm((f) => ({ ...f, lon: e.target.value }))}
                placeholder="5,1214"
                required
              />
            </label>
          </div>
          <button type="button" className="btn btn--secondary" onClick={fillCurrentPosition} disabled={locating}>
            {locating ? 'Locatie bepalen…' : '📍 Gebruik huidige locatie'}
          </button>
          {locateError && <p className="helper">{locateError}</p>}
          <label>
            Straal (meter)
            <input
              className="field"
              value={form.radiusM}
              onChange={(e) => setForm((f) => ({ ...f, radiusM: e.target.value }))}
            />
          </label>
          <div className="form-row">
            <button type="submit" className="btn">
              {editingId ? 'Opslaan' : 'Toevoegen'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyLocationForm);
                }}
              >
                Annuleren
              </button>
            )}
          </div>
        </form>

        <div className="section">
          {locations?.length === 0 && <p className="helper">Nog geen vaste locaties.</p>}
          {locations?.map((loc) => (
            <div className="card trip-card__top" key={loc.id}>
              <div>
                <h3>{loc.name}</h3>
                <p className="helper">
                  {loc.lat}, {loc.lon} · straal {loc.radiusM} m
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => startEdit(loc)}>
                  Bewerken
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => deleteLocation(loc.id)}
                >
                  Verwijderen
                </button>
              </div>
            </div>
          ))}
        </div>

        {locations && locations.length >= 2 && (
          <div className="section">
            <h2>Standaardregels per locatiepaar</h2>
            <p className="helper">
              Bijv. Thuis → Kantoor = Zakelijk, omschrijving "woon-werk". Woon-werkverkeer telt als
              zakelijk voor de 500 km-regel.
            </p>
            <form className="card form-grid" onSubmit={handleAddRule}>
              <div className="form-row">
                <label>
                  Van
                  <select
                    className="field"
                    value={ruleForm.fromLocationId}
                    onChange={(e) => setRuleForm((f) => ({ ...f, fromLocationId: e.target.value }))}
                    required
                  >
                    <option value="">Kies…</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Naar
                  <select
                    className="field"
                    value={ruleForm.toLocationId}
                    onChange={(e) => setRuleForm((f) => ({ ...f, toLocationId: e.target.value }))}
                    required
                  >
                    <option value="">Kies…</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Soort
                <div className="type-toggle" role="group">
                  <button
                    type="button"
                    className="type-toggle__zakelijk"
                    aria-pressed={ruleForm.tripType === 'zakelijk'}
                    onClick={() => setRuleForm((f) => ({ ...f, tripType: 'zakelijk' }))}
                  >
                    Zakelijk
                  </button>
                  <button
                    type="button"
                    className="type-toggle__prive"
                    aria-pressed={ruleForm.tripType === 'privé'}
                    onClick={() => setRuleForm((f) => ({ ...f, tripType: 'privé' }))}
                  >
                    Privé
                  </button>
                </div>
              </label>
              <label>
                Omschrijving
                <input
                  className="field"
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <button type="submit" className="btn">
                Regel toevoegen
              </button>
            </form>

            {rules?.map((rule) => (
              <div className="card trip-card__top" key={rule.id}>
                <span>
                  {locationName(rule.fromLocationId)} → {locationName(rule.toLocationId)}:{' '}
                  <span className={`badge badge--${rule.tripType === 'zakelijk' ? 'zakelijk' : 'prive'}`}>
                    {rule.tripType}
                  </span>{' '}
                  {rule.description}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => deleteLocationPairRule(rule.id)}
                >
                  Verwijderen
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
