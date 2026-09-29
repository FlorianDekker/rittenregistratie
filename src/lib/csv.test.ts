import { describe, expect, it } from 'vitest';
import { buildCsv, type CsvCar, type CsvTrip } from './csv';

describe('buildCsv', () => {
  const car: CsvCar = {
    brand: 'Volkswagen',
    model: 'ID.4',
    licensePlate: 'AB-123-C',
    periodStart: '2026-01-01',
    periodEnd: '',
  };

  const trips: CsvTrip[] = [
    {
      date: '2026-01-05',
      startTimeMs: new Date('2026-01-05T08:00:00Z').getTime(),
      endTimeMs: new Date('2026-01-05T08:30:00Z').getTime(),
      startOdometer: 1000,
      endOdometer: 1015.5,
      distanceKm: 15.5,
      startAddress: 'Thuis',
      endAddress: 'Kantoor',
      routeDeviation: '',
      tripType: 'zakelijk',
      privateDetourKm: 0,
      description: 'woon-werk',
    },
    {
      date: '2026-01-05',
      startTimeMs: new Date('2026-01-05T18:00:00Z').getTime(),
      endTimeMs: new Date('2026-01-05T18:20:00Z').getTime(),
      startOdometer: 1015.5,
      endOdometer: 1025.5,
      distanceKm: 10,
      startAddress: 'Kantoor',
      endAddress: 'Sportschool',
      routeDeviation: 'Via de snelweg i.p.v. binnendoor (drukte)',
      tripType: 'privé',
      privateDetourKm: 2.5,
      description: '',
    },
  ];

  it('begint met een BOM en gebruikt ; als scheidingsteken', () => {
    const csv = buildCsv(car, trips, 'Januari 2026');
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain(';');
  });

  it('bevat autogegevens in de kopregels', () => {
    const csv = buildCsv(car, trips, 'Januari 2026');
    expect(csv).toContain('Volkswagen ID.4');
    expect(csv).toContain('AB-123-C');
  });

  it('gebruikt komma als decimaalteken en dd-mm-jjjj als datumnotatie', () => {
    const csv = buildCsv(car, trips, 'Januari 2026');
    expect(csv).toContain('15,5');
    expect(csv).toContain('05-01-2026');
    expect(csv).not.toMatch(/\d+\.\d+/); // geen punt-decimalen in de getallen
  });

  it('telt totalen zakelijk/privé correct op (privé incl. omrijkm)', () => {
    const csv = buildCsv(car, trips, 'Januari 2026');
    expect(csv).toContain('Totaal zakelijk (km);15,5');
    // 10 km + 2,5 km omrijkm = 12,5
    expect(csv).toContain('Totaal privé (km, incl. omrijkm);12,5');
  });

  it('bevat alle verplichte kolommen in de header', () => {
    const csv = buildCsv(car, trips, 'Januari 2026');
    const headerLine = csv.split('\r\n')[5];
    for (const col of [
      'Datum',
      'Vertrektijd',
      'Aankomsttijd',
      'Beginstand km',
      'Eindstand km',
      'Afstand km',
      'Vertrekadres',
      'Aankomstadres',
      'Afwijkende route',
      'Soort',
      'Privé-omrijkm',
      'Omschrijving',
    ]) {
      expect(headerLine).toContain(col);
    }
  });
});
