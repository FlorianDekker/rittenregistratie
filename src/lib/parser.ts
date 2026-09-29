// Parser voor Rittenlog.txt (aangeleverd door de iOS Opdrachten-automatisering).
//
// Formaat per regel: TYPE|datum|breedtegraad|lengtegraad|adres
// - TYPE is START of STOP.
// - Datum kan ISO 8601 zijn (met tijdzone-offset) of "dd-mm-jjjj uu:mm" (NL-notatie).
// - Coördinaten kunnen een komma als decimaalteken hebben (NL-locale).
// - Het adresveld kan leeg zijn of (door een kopieerfout/export) regeleinden bevatten;
//   die behandelen we als voortzetting van dezelfde regel en voegen we samen met ", ".

export interface ParsedEvent {
  type: 'START' | 'STOP';
  timestampMs: number;
  lat: number;
  lon: number;
  address: string;
  raw: string;
  /** Dedup-sleutel: `${type}|${timestampMs}`. */
  key: string;
}

export interface ParseWarning {
  line: number;
  raw: string;
  reason: string;
}

export interface ParseResult {
  events: ParsedEvent[];
  warnings: ParseWarning[];
}

// Een nieuw record herkennen we aan een regel die begint met "iets|" (een
// woord gevolgd door een pijp). Dat is ruimer dan alleen START/STOP, zodat
// een regel met een fout type (bv. "FOO|...") ook als eigen record wordt
// behandeld en netjes als waarschuwing eindigt, in plaats van stilletjes te
// worden geplakt aan het vorige of eerstvolgende adres.
const RECORD_START = /^\S+\|/;

/**
 * Zet de ruwe tekst om naar logische records. Een nieuw record begint alleen
 * bij een regel die met "START|" of "STOP|" begint; alle daaropvolgende
 * regels tot het volgende record worden er met ", " aan vastgeplakt. Zo
 * blijft de parser robuust voor adresvelden met embedded regeleinden.
 */
function toRecords(text: string): { raw: string; line: number }[] {
  const lines = text.split(/\r\n|\r|\n/);
  const records: { raw: string; line: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (RECORD_START.test(line)) {
      records.push({ raw: line.trim(), line: i + 1 });
    } else if (line.trim() === '') {
      // lege regel: negeren, geen voortzetting
      continue;
    } else if (records.length > 0) {
      // voortzetting van het vorige record (bv. adres met regeleinde)
      const prev = records[records.length - 1];
      const extra = line.trim();
      if (extra) {
        prev.raw = `${prev.raw}, ${extra}`;
      }
    }
    // regels vóór het eerste record die geen START/STOP zijn: negeren
  }

  return records;
}

/** Parseert een coördinaat-string die zowel "52.0907" als "52,0907" kan zijn. */
function parseCoord(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

const NL_DATE = /^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Parseert ISO 8601 (met offset) of de NL-notatie "dd-mm-jjjj uu:mm[:ss]". */
function parseTimestamp(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;

  const nlMatch = NL_DATE.exec(trimmed);
  if (nlMatch) {
    const [, dd, mm, yyyy, hh, min, ss] = nlMatch;
    const d = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      ss ? Number(ss) : 0,
    );
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }

  // ISO 8601 (met of zonder offset/tijd)
  const iso = new Date(trimmed);
  if (!Number.isNaN(iso.getTime())) return iso.getTime();

  return null;
}

/** Vervangt embedded regeleinden in het adres (indien nog aanwezig) door ", ". */
function cleanAddress(value: string): string {
  return value
    .split(/\r\n|\r|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .join(', ');
}

export function parseRittenlog(text: string): ParseResult {
  const events: ParsedEvent[] = [];
  const warnings: ParseWarning[] = [];
  const records = toRecords(text);

  for (const { raw, line } of records) {
    const parts = raw.split('|');
    if (parts.length < 4) {
      warnings.push({ line, raw, reason: 'Te weinig velden (verwacht TYPE|datum|lat|lon|adres).' });
      continue;
    }

    const [typeRaw, dateRaw, latRaw, lonRaw, ...addressParts] = parts;
    const type = typeRaw.trim().toUpperCase();
    if (type !== 'START' && type !== 'STOP') {
      warnings.push({ line, raw, reason: `Onbekend type "${typeRaw}" (verwacht START of STOP).` });
      continue;
    }

    const timestampMs = parseTimestamp(dateRaw);
    if (timestampMs === null) {
      warnings.push({ line, raw, reason: `Datum kon niet worden gelezen: "${dateRaw}".` });
      continue;
    }

    const lat = parseCoord(latRaw);
    const lon = parseCoord(lonRaw);
    if (lat === null || lon === null) {
      warnings.push({ line, raw, reason: `Coördinaten konden niet worden gelezen: "${latRaw}", "${lonRaw}".` });
      continue;
    }

    const address = cleanAddress(addressParts.join('|'));

    events.push({
      type,
      timestampMs,
      lat,
      lon,
      address,
      raw,
      key: `${type}|${timestampMs}`,
    });
  }

  return { events, warnings };
}
