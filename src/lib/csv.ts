import { formatDateNL, formatNumberNL, formatTimeNL } from './format';

// CSV-export voor de Belastingdienst: UTF-8 met BOM, ';'-gescheiden,
// Nederlandse decimale komma, datum dd-mm-jjjj.

export interface CsvCar {
  brand: string;
  model: string;
  licensePlate: string;
  periodStart: string;
  periodEnd: string;
}

export interface CsvTrip {
  date: string;
  startTimeMs: number;
  endTimeMs: number;
  startOdometer: number;
  endOdometer: number;
  distanceKm: number;
  startAddress: string;
  endAddress: string;
  routeDeviation: string;
  tripType: 'zakelijk' | 'privé';
  privateDetourKm: number;
  description: string;
}

const BOM = '﻿';

function escapeCsv(value: string): string {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatPeriod(periodStart: string, periodEnd: string): string {
  const start = periodStart ? formatDateNL(new Date(periodStart).getTime()) : '';
  const end = periodEnd ? formatDateNL(new Date(periodEnd).getTime()) : 'heden';
  return `${start} – ${end}`;
}

export function buildCsv(car: CsvCar, trips: CsvTrip[], periodLabel: string): string {
  const lines: string[] = [];

  lines.push(escapeCsv(`Rittenregistratie – ${periodLabel}`));
  lines.push(`${escapeCsv('Auto')};${escapeCsv(`${car.brand} ${car.model}`.trim())}`);
  lines.push(`${escapeCsv('Kenteken')};${escapeCsv(car.licensePlate)}`);
  lines.push(`${escapeCsv('Gebruiksperiode')};${escapeCsv(formatPeriod(car.periodStart, car.periodEnd))}`);
  lines.push('');

  const headers = [
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
  ];
  lines.push(headers.map(escapeCsv).join(';'));

  let totalZakelijk = 0;
  let totalPrive = 0;

  const sorted = [...trips].sort((a, b) => a.startTimeMs - b.startTimeMs);

  for (const trip of sorted) {
    if (trip.tripType === 'zakelijk') totalZakelijk += trip.distanceKm;
    else totalPrive += trip.distanceKm + trip.privateDetourKm;

    const row = [
      formatDateNL(new Date(trip.date).getTime()),
      formatTimeNL(trip.startTimeMs),
      formatTimeNL(trip.endTimeMs),
      formatNumberNL(trip.startOdometer),
      formatNumberNL(trip.endOdometer),
      formatNumberNL(trip.distanceKm),
      trip.startAddress,
      trip.endAddress,
      trip.routeDeviation,
      trip.tripType === 'zakelijk' ? 'Zakelijk' : 'Privé',
      formatNumberNL(trip.privateDetourKm),
      trip.description,
    ];
    lines.push(row.map((v) => escapeCsv(String(v))).join(';'));
  }

  lines.push('');
  lines.push(`${escapeCsv('Totaal zakelijk (km)')};${escapeCsv(formatNumberNL(totalZakelijk))}`);
  lines.push(`${escapeCsv('Totaal privé (km, incl. omrijkm)')};${escapeCsv(formatNumberNL(totalPrive))}`);

  return BOM + lines.join('\r\n');
}
