import { describe, expect, it } from 'vitest';
import { applyCheckpoint, recomputeChain, type ChainTrip } from './kmchain';

function trip(id: string, startTimeMs: number, distanceKm: number): ChainTrip {
  return { id, startTimeMs, distanceKm, startOdometer: 0, endOdometer: 0, locked: false };
}

describe('recomputeChain', () => {
  it('begin-km van een rit = eind-km van de vorige rit', () => {
    const trips = [trip('t1', 1000, 10), trip('t2', 2000, 5.5), trip('t3', 3000, 2)];
    const result = recomputeChain(trips, 1000);

    expect(result[0]).toMatchObject({ startOdometer: 1000, endOdometer: 1010 });
    expect(result[1]).toMatchObject({ startOdometer: 1010, endOdometer: 1015.5 });
    expect(result[2]).toMatchObject({ startOdometer: 1015.5, endOdometer: 1017.5 });
  });

  it('sorteert eerst chronologisch op starttijd', () => {
    const trips = [trip('t2', 2000, 5), trip('t1', 1000, 10)];
    const result = recomputeChain(trips, 0);
    expect(result.map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('slaat locked ritten over als anker en gaat daarna verder vanaf hun eindstand', () => {
    const locked: ChainTrip = {
      id: 'locked',
      startTimeMs: 1500,
      distanceKm: 999, // moet genegeerd worden
      startOdometer: 1234,
      endOdometer: 1240,
      locked: true,
    };
    const trips = [trip('before', 1000, 10), locked, trip('after', 2000, 5)];
    const result = recomputeChain(trips, 1000);

    const before = result.find((t) => t.id === 'before')!;
    const lockedResult = result.find((t) => t.id === 'locked')!;
    const after = result.find((t) => t.id === 'after')!;

    expect(before).toMatchObject({ startOdometer: 1000, endOdometer: 1010 });
    expect(lockedResult).toMatchObject({ startOdometer: 1234, endOdometer: 1240 });
    expect(after).toMatchObject({ startOdometer: 1240, endOdometer: 1245 });
  });
});

describe('applyCheckpoint', () => {
  it('verdeelt het verschil proportioneel naar rato van afstand', () => {
    // Berekende eindstand: 1000 + 10 + 30 = 1040. Echte stand: 1044 -> diff 4.
    const trips = [trip('t1', 1000, 10), trip('t2', 2000, 30)];
    const { trips: result, diffKm } = applyCheckpoint(trips, 1000, 1044);

    expect(diffKm).toBe(4);
    // t1 krijgt 10/40 * 4 = 1 km erbij, t2 krijgt 30/40 * 4 = 3 km erbij.
    const t1 = result.find((t) => t.id === 't1')!;
    const t2 = result.find((t) => t.id === 't2')!;
    expect(t1.distanceKm).toBeCloseTo(11, 5);
    expect(t2.distanceKm).toBeCloseTo(33, 5);
    expect(t2.endOdometer).toBe(1044);
  });

  it('laat de keten ongewijzigd als de echte stand overeenkomt met de berekende stand', () => {
    const trips = [trip('t1', 1000, 10), trip('t2', 2000, 5)];
    const { diffKm, trips: result } = applyCheckpoint(trips, 100, 115);
    expect(diffKm).toBe(0);
    expect(result[1].endOdometer).toBe(115);
  });

  it('werkt ook als er geen ritten sinds het vorige ijkpunt zijn', () => {
    const { diffKm, trips: result } = applyCheckpoint([], 100, 120);
    expect(diffKm).toBe(20);
    expect(result).toHaveLength(0);
  });

  it('verwerkt een negatief verschil (teller lager dan berekend)', () => {
    const trips = [trip('t1', 1000, 10), trip('t2', 2000, 10)];
    const { trips: result, diffKm } = applyCheckpoint(trips, 0, 18);
    expect(diffKm).toBe(-2);
    expect(result[1].endOdometer).toBe(18);
  });
});
