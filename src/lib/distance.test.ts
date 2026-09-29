import { describe, expect, it, vi } from 'vitest';
import { estimateDistanceKm, fetchDistanceKm, haversineKm } from './distance';

describe('haversineKm', () => {
  it('geeft ~0 voor hetzelfde punt', () => {
    expect(haversineKm(52.09, 5.12, 52.09, 5.12)).toBeCloseTo(0, 5);
  });

  it('berekent een plausibele afstand Utrecht-Amsterdam (~35-45 km)', () => {
    const km = haversineKm(52.0907, 5.1214, 52.3702, 4.8952);
    expect(km).toBeGreaterThan(30);
    expect(km).toBeLessThan(50);
  });
});

describe('estimateDistanceKm', () => {
  it('is de hemelsbrede afstand keer 1,25, afgerond op 1 decimaal', () => {
    const raw = haversineKm(52.0907, 5.1214, 52.3702, 4.8952);
    expect(estimateDistanceKm(52.0907, 5.1214, 52.3702, 4.8952)).toBeCloseTo(
      Math.round(raw * 1.25 * 10) / 10,
      5,
    );
  });
});

describe('fetchDistanceKm', () => {
  it('gebruikt de OSRM-afstand (meters -> km) bij een geldig antwoord', async () => {
    const fakeFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ code: 'Ok', routes: [{ distance: 12345 }] }),
    })) as unknown as typeof fetch;

    const result = await fetchDistanceKm(52.09, 5.12, 52.37, 4.9, fakeFetch);
    expect(result).toEqual({ km: 12.3, estimated: false });
  });

  it('valt terug op de schatting als de fetch faalt', async () => {
    const fakeFetch = vi.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;

    const result = await fetchDistanceKm(52.0907, 5.1214, 52.3702, 4.8952, fakeFetch);
    expect(result.estimated).toBe(true);
    expect(result.km).toBeCloseTo(estimateDistanceKm(52.0907, 5.1214, 52.3702, 4.8952), 5);
  });

  it('valt terug op de schatting bij een HTTP-foutstatus', async () => {
    const fakeFetch = vi.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch;
    const result = await fetchDistanceKm(52.0907, 5.1214, 52.3702, 4.8952, fakeFetch);
    expect(result.estimated).toBe(true);
  });

  it('valt terug op de schatting als OSRM geen route vindt', async () => {
    const fakeFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ code: 'NoRoute' }),
    })) as unknown as typeof fetch;
    const result = await fetchDistanceKm(52.0907, 5.1214, 52.3702, 4.8952, fakeFetch);
    expect(result.estimated).toBe(true);
  });
});
