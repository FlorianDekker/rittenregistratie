import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, newId, addCar, updateCar, deleteCar } from '../db';
import { recalculateCarChain } from '../actions';
import { formatNumberNL, parseNumberNL } from '../lib/format';
import type { Car } from '../types';

const emptyForm = {
  brand: '',
  model: '',
  licensePlate: '',
  periodStart: new Date().toISOString().slice(0, 10),
  periodEnd: '',
  startOdometer: '0',
};

export default function Cars() {
  const cars = useLiveQuery(() => db.cars.toArray());
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const car: Car = {
      id: editingId ?? newId(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      licensePlate: form.licensePlate.trim().toUpperCase(),
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      startOdometer: parseNumberNL(form.startOdometer) || 0,
    };
    if (editingId) {
      await updateCar(editingId, car);
      await recalculateCarChain(editingId);
    } else {
      await addCar(car);
    }
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(car: Car) {
    setEditingId(car.id);
    setForm({
      brand: car.brand,
      model: car.model,
      licensePlate: car.licensePlate,
      periodStart: car.periodStart,
      periodEnd: car.periodEnd,
      startOdometer: formatNumberNL(car.startOdometer),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Auto verwijderen? Ritten van deze auto blijven bewaard maar verliezen de koppeling.')) {
      return;
    }
    await deleteCar(id);
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Auto&apos;s</h1>
      </header>
      <main className="app__main">
        <form className="card form-grid" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Auto bewerken' : 'Auto toevoegen'}</h2>
          <div className="form-row">
            <label>
              Merk
              <input
                className="field"
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                required
              />
            </label>
            <label>
              Type
              <input
                className="field"
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                required
              />
            </label>
          </div>
          <label>
            Kenteken
            <input
              className="field"
              value={form.licensePlate}
              onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))}
              required
            />
          </label>
          <div className="form-row">
            <label>
              Gebruik vanaf
              <input
                className="field"
                type="date"
                value={form.periodStart}
                onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
                required
              />
            </label>
            <label>
              Gebruik tot (optioneel)
              <input
                className="field"
                type="date"
                value={form.periodEnd}
                onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))}
              />
            </label>
          </div>
          <label>
            Start-kilometerstand
            <input
              className="field"
              type="text"
              inputMode="decimal"
              value={form.startOdometer}
              onChange={(e) => setForm((f) => ({ ...f, startOdometer: e.target.value }))}
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
                  setForm(emptyForm);
                }}
              >
                Annuleren
              </button>
            )}
          </div>
        </form>

        <div className="section">
          {cars?.length === 0 && <p className="helper">Nog geen auto&apos;s toegevoegd.</p>}
          {cars?.map((car) => (
            <div className="card" key={car.id}>
              <div className="trip-card__top">
                <div>
                  <h3>
                    {car.brand} {car.model}
                  </h3>
                  <p className="helper">
                    {car.licensePlate} · {car.periodStart} – {car.periodEnd || 'heden'} · start{' '}
                    {formatNumberNL(car.startOdometer)} km
                  </p>
                </div>
              </div>
              <div className="form-row">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => startEdit(car)}>
                  Bewerken
                </button>
                <button
                  type="button"
                  className="btn btn--danger btn--sm"
                  onClick={() => handleDelete(car.id)}
                >
                  Verwijderen
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
