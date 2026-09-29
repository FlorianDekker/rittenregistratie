import { describe, expect, it } from 'vitest';
import { suggestMerges, type MergeCandidateTrip } from './merge';

describe('suggestMerges', () => {
  it('suggereert samenvoegen bij een korte stop (< 15 min) op vrijwel dezelfde plek', () => {
    const trips: MergeCandidateTrip[] = [
      {
        id: 't1',
        endTimeMs: new Date('2026-09-29T10:00:00Z').getTime(),
        endLat: 52.0,
        endLon: 5.0,
        startTimeMs: new Date('2026-09-29T09:30:00Z').getTime(),
        startLat: 51.9,
        startLon: 4.9,
      },
      {
        id: 't2',
        startTimeMs: new Date('2026-09-29T10:10:00Z').getTime(),
        startLat: 52.0005,
        startLon: 5.0005,
        endTimeMs: new Date('2026-09-29T10:40:00Z').getTime(),
        endLat: 52.1,
        endLon: 5.1,
      },
    ];

    const suggestions = suggestMerges(trips);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({ firstTripId: 't1', secondTripId: 't2' });
    expect(suggestions[0].gapMinutes).toBeCloseTo(10, 1);
  });

  it('suggereert niets als de stop te lang duurt (> 15 min)', () => {
    const trips: MergeCandidateTrip[] = [
      {
        id: 't1',
        endTimeMs: new Date('2026-09-29T10:00:00Z').getTime(),
        endLat: 52.0,
        endLon: 5.0,
        startTimeMs: new Date('2026-09-29T09:30:00Z').getTime(),
        startLat: 51.9,
        startLon: 4.9,
      },
      {
        id: 't2',
        startTimeMs: new Date('2026-09-29T10:30:00Z').getTime(),
        startLat: 52.0005,
        startLon: 5.0005,
        endTimeMs: new Date('2026-09-29T11:00:00Z').getTime(),
        endLat: 52.1,
        endLon: 5.1,
      },
    ];
    expect(suggestMerges(trips)).toHaveLength(0);
  });

  it('suggereert niets als de locaties te ver uit elkaar liggen', () => {
    const trips: MergeCandidateTrip[] = [
      {
        id: 't1',
        endTimeMs: new Date('2026-09-29T10:00:00Z').getTime(),
        endLat: 52.0,
        endLon: 5.0,
        startTimeMs: new Date('2026-09-29T09:30:00Z').getTime(),
        startLat: 51.9,
        startLon: 4.9,
      },
      {
        id: 't2',
        startTimeMs: new Date('2026-09-29T10:05:00Z').getTime(),
        startLat: 53.0,
        startLon: 6.0,
        endTimeMs: new Date('2026-09-29T10:30:00Z').getTime(),
        endLat: 53.1,
        endLon: 6.1,
      },
    ];
    expect(suggestMerges(trips)).toHaveLength(0);
  });
});
