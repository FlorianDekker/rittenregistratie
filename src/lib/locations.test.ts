import { describe, expect, it } from 'vitest';
import { findPairRule, matchLocation, type MatchableLocation } from './locations';

describe('matchLocation', () => {
  const locations: MatchableLocation[] = [
    { id: 'thuis', lat: 52.0, lon: 5.0, radiusM: 200 },
    { id: 'kantoor', lat: 52.37, lon: 4.9, radiusM: 150 },
  ];

  it('matcht een punt binnen de straal van een locatie', () => {
    const match = matchLocation(52.0001, 5.0001, locations);
    expect(match?.id).toBe('thuis');
  });

  it('matcht niets als een punt buiten alle stralen valt', () => {
    const match = matchLocation(51.0, 4.0, locations);
    expect(match).toBeUndefined();
  });

  it('kiest de dichtstbijzijnde locatie bij overlap', () => {
    const overlapping: MatchableLocation[] = [
      { id: 'ver', lat: 52.0, lon: 5.0, radiusM: 5000 },
      { id: 'dichtbij', lat: 52.0001, lon: 5.0001, radiusM: 5000 },
    ];
    const match = matchLocation(52.0001, 5.0001, overlapping);
    expect(match?.id).toBe('dichtbij');
  });
});

describe('findPairRule', () => {
  it('vindt de standaardregel voor een gericht locatiepaar', () => {
    const rules = [
      { fromLocationId: 'thuis', toLocationId: 'kantoor', tripType: 'zakelijk' as const, description: 'woon-werk' },
    ];
    expect(findPairRule('thuis', 'kantoor', rules)?.description).toBe('woon-werk');
    expect(findPairRule('kantoor', 'thuis', rules)).toBeUndefined();
  });
});
