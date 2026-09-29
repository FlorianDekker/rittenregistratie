// Koppelt START- en STOP-events chronologisch tot ritten.
// Werkt puur op data (geen DB/netwerk), zodat het goed testbaar is.

export interface LinkableEvent {
  id: string;
  type: 'START' | 'STOP';
  timestampMs: number;
  lat: number;
  lon: number;
  address: string;
}

export interface LinkedPair {
  start: LinkableEvent;
  stop: LinkableEvent;
}

export interface LinkResult {
  pairs: LinkedPair[];
  /** START-events zonder bijbehorende STOP (bv. laatste rit nog niet afgerond). */
  orphanStarts: LinkableEvent[];
  /** STOP-events zonder voorafgaande START. */
  orphanStops: LinkableEvent[];
}

export function linkEvents(events: LinkableEvent[]): LinkResult {
  const sorted = [...events].sort((a, b) => a.timestampMs - b.timestampMs);

  const pairs: LinkedPair[] = [];
  const orphanStarts: LinkableEvent[] = [];
  const orphanStops: LinkableEvent[] = [];

  let pending: LinkableEvent | null = null;

  for (const event of sorted) {
    if (event.type === 'START') {
      if (pending) {
        // Vorige START werd nooit gesloten: markeer als wees en begin opnieuw.
        orphanStarts.push(pending);
      }
      pending = event;
    } else {
      // STOP
      if (pending) {
        pairs.push({ start: pending, stop: event });
        pending = null;
      } else {
        orphanStops.push(event);
      }
    }
  }

  if (pending) {
    orphanStarts.push(pending);
  }

  return { pairs, orphanStarts, orphanStops };
}
