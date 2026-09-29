// Formatteer-helpers voor Nederlandse notatie (datum dd-mm-jjjj, komma als
// decimaalteken, tijd uu:mm).

export function formatDateNL(ms: number): string {
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function formatTimeNL(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

/** Formatteert een getal met komma als decimaalteken, vast aantal decimalen. */
export function formatNumberNL(n: number, decimals = 1): string {
  return n.toFixed(decimals).replace('.', ',');
}

/** Zet een NL-notatie (komma-decimaal) om naar een getal. */
export function parseNumberNL(value: string): number {
  return Number(value.trim().replace(/\./g, '').replace(',', '.'));
}

/** ISO-datum (jjjj-mm-dd) op basis van een epoch-tijdstip, lokale tijd. */
export function isoDateFromMs(ms: number): string {
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
