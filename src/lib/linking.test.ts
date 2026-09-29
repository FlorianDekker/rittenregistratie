import { describe, expect, it } from 'vitest';
import { linkEvents, type LinkableEvent } from './linking';

function ev(type: 'START' | 'STOP', id: string, ms: number): LinkableEvent {
  return { id, type, timestampMs: ms, lat: 52, lon: 5, address: `adres-${id}` };
}

describe('linkEvents', () => {
  it('koppelt START en STOP tot een rit', () => {
    const { pairs, orphanStarts, orphanStops } = linkEvents([
      ev('START', 'a', 1000),
      ev('STOP', 'b', 2000),
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].start.id).toBe('a');
    expect(pairs[0].stop.id).toBe('b');
    expect(orphanStarts).toHaveLength(0);
    expect(orphanStops).toHaveLength(0);
  });

  it('koppelt meerdere ritten chronologisch, ook als events niet gesorteerd binnenkomen', () => {
    const { pairs } = linkEvents([
      ev('STOP', 'b1', 2000),
      ev('START', 'a2', 3000),
      ev('START', 'a1', 1000),
      ev('STOP', 'b2', 4000),
    ]);
    expect(pairs).toHaveLength(2);
    expect(pairs[0]).toMatchObject({ start: { id: 'a1' }, stop: { id: 'b1' } });
    expect(pairs[1]).toMatchObject({ start: { id: 'a2' }, stop: { id: 'b2' } });
  });

  it('markeert een STOP zonder voorafgaande START als wees', () => {
    const { pairs, orphanStops } = linkEvents([ev('STOP', 'b', 1000)]);
    expect(pairs).toHaveLength(0);
    expect(orphanStops).toHaveLength(1);
    expect(orphanStops[0].id).toBe('b');
  });

  it('markeert een START zonder afsluitende STOP als wees (bv. laatste rit nog bezig)', () => {
    const { pairs, orphanStarts } = linkEvents([ev('START', 'a', 1000)]);
    expect(pairs).toHaveLength(0);
    expect(orphanStarts).toHaveLength(1);
    expect(orphanStarts[0].id).toBe('a');
  });

  it('bij twee STARTs op rij wordt de eerste als wees gemarkeerd en gaat de tweede door', () => {
    const { pairs, orphanStarts } = linkEvents([
      ev('START', 'a1', 1000),
      ev('START', 'a2', 2000),
      ev('STOP', 'b2', 3000),
    ]);
    expect(orphanStarts).toHaveLength(1);
    expect(orphanStarts[0].id).toBe('a1');
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ start: { id: 'a2' }, stop: { id: 'b2' } });
  });
});
