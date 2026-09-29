import { describe, expect, it } from 'vitest';
import { parseRittenlog } from './parser';

describe('parseRittenlog', () => {
  it('parseert normale START/STOP-regels met ISO-datum en punt-decimalen', () => {
    const text = [
      'START|2026-09-29T08:12:33+02:00|52.0907|5.1214|Straatnaam 1, 3511 AB Utrecht',
      'STOP|2026-09-29T08:41:02+02:00|52.3702|4.8952|Damrak 1, 1012 LG Amsterdam',
    ].join('\n');

    const { events, warnings } = parseRittenlog(text);

    expect(warnings).toHaveLength(0);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      type: 'START',
      lat: 52.0907,
      lon: 5.1214,
      address: 'Straatnaam 1, 3511 AB Utrecht',
    });
    expect(events[1].type).toBe('STOP');
  });

  it('ondersteunt Nederlandse komma-decimalen in coördinaten', () => {
    const text = 'START|2026-09-29T08:12:33+02:00|52,0907|5,1214|Straatnaam 1';
    const { events, warnings } = parseRittenlog(text);

    expect(warnings).toHaveLength(0);
    expect(events[0].lat).toBeCloseTo(52.0907);
    expect(events[0].lon).toBeCloseTo(5.1214);
  });

  it('ondersteunt de afwijkende NL-datumnotatie dd-mm-jjjj uu:mm', () => {
    const text = 'START|29-09-2026 08:12|52,0907|5,1214|Straatnaam 1';
    const { events, warnings } = parseRittenlog(text);

    expect(warnings).toHaveLength(0);
    expect(events).toHaveLength(1);
    const d = new Date(events[0].timestampMs);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // september = index 8
    expect(d.getDate()).toBe(29);
    expect(d.getHours()).toBe(8);
    expect(d.getMinutes()).toBe(12);
  });

  it('slaat lege regels stil over', () => {
    const text = [
      'START|2026-09-29T08:12:33+02:00|52.0907|5.1214|Adres A',
      '',
      '',
      'STOP|2026-09-29T08:41:02+02:00|52.3702|4.8952|Adres B',
    ].join('\n');

    const { events, warnings } = parseRittenlog(text);
    expect(events).toHaveLength(2);
    expect(warnings).toHaveLength(0);
  });

  it('meldt kapotte regels (onbekend type, kapotte datum/coördinaten) en slaat ze over', () => {
    const text = [
      'FOO|2026-09-29T08:12:33+02:00|52.0907|5.1214|Adres A',
      'START|geen-datum|52.0907|5.1214|Adres B',
      'START|2026-09-29T08:12:33+02:00|abc|5.1214|Adres C',
      'START|2026-09-29T08:12:33+02:00',
      'STOP|2026-09-29T08:41:02+02:00|52.3702|4.8952|Adres D',
    ].join('\n');

    const { events, warnings } = parseRittenlog(text);
    expect(events).toHaveLength(1);
    expect(events[0].address).toBe('Adres D');
    expect(warnings).toHaveLength(4);
  });

  it('voegt regeleinden in het adresveld samen met ", "', () => {
    const text = ['START|2026-09-29T08:12:33+02:00|52.0907|5.1214|Straatnaam 1', '3511 AB Utrecht'].join(
      '\n',
    );
    const { events } = parseRittenlog(text);
    expect(events[0].address).toBe('Straatnaam 1, 3511 AB Utrecht');
  });

  it('accepteert een leeg adresveld', () => {
    const text = 'START|2026-09-29T08:12:33+02:00|52.0907|5.1214|';
    const { events, warnings } = parseRittenlog(text);
    expect(warnings).toHaveLength(0);
    expect(events[0].address).toBe('');
  });

  it('geeft dezelfde dedup-sleutel voor identieke events bij herhaald parsen (idempotent-basis)', () => {
    const text = 'START|2026-09-29T08:12:33+02:00|52.0907|5.1214|Adres A';
    const first = parseRittenlog(text).events[0];
    const second = parseRittenlog(text).events[0];
    expect(first.key).toBe(second.key);
    expect(first.key).toBe('START|' + first.timestampMs);
  });

  it('een groeiend bestand: opnieuw parsen + dedupliceren op key geeft geen duplicaten', () => {
    const initial = [
      'START|2026-09-29T08:12:33+02:00|52.0907|5.1214|Adres A',
      'STOP|2026-09-29T08:41:02+02:00|52.3702|4.8952|Adres B',
    ].join('\n');
    const grown = [
      initial,
      'START|2026-09-29T17:00:00+02:00|52.3702|4.8952|Adres B',
      'STOP|2026-09-29T17:30:00+02:00|52.0907|5.1214|Adres A',
    ].join('\n');

    const byKey = new Map<string, ReturnType<typeof parseRittenlog>['events'][number]>();
    for (const e of parseRittenlog(initial).events) byKey.set(e.key, e);
    for (const e of parseRittenlog(grown).events) byKey.set(e.key, e);

    expect(byKey.size).toBe(4);
  });
});
