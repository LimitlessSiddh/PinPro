import { describe, expect, it } from 'vitest';
import { formatHandicap, formatToPar, parseYards, suggestClub } from './golf';

const bag = { Driver: 250, '7 Iron': 150, '9 Iron': 130, 'Pitching Wedge': 115 };

describe('suggestClub', () => {
  it('picks the shortest club that still carries the distance', () => {
    expect(suggestClub(140, bag)).toEqual({ kind: 'fit', club: '7 Iron', yards: 150 });
    expect(suggestClub(120, bag)).toEqual({ kind: 'fit', club: '9 Iron', yards: 130 });
  });

  it('treats an exact match as a fit (boundary)', () => {
    expect(suggestClub(150, bag)).toEqual({ kind: 'fit', club: '7 Iron', yards: 150 });
    expect(suggestClub(151, bag)).toEqual({ kind: 'fit', club: 'Driver', yards: 250 });
  });

  it('falls back to the longest club beyond max range', () => {
    expect(suggestClub(300, bag)).toEqual({ kind: 'max', club: 'Driver', yards: 250 });
  });

  it('suggests the short game inside 30 yards', () => {
    expect(suggestClub(30, bag)).toEqual({ kind: 'short' });
    expect(suggestClub(31, bag)).toEqual({ kind: 'fit', club: 'Pitching Wedge', yards: 115 });
  });

  it('returns null when no usable clubs are saved', () => {
    expect(suggestClub(150, {})).toBeNull();
    expect(suggestClub(150, { Driver: 0, '7 Iron': Number.NaN })).toBeNull();
  });
});

describe('parseYards', () => {
  it('accepts whole yards in range', () => {
    expect(parseYards(' 150 ')).toEqual({ value: 150, error: null });
  });
  it('rejects empty, decimals, negatives, text and out-of-range values', () => {
    for (const bad of ['', '150.5', '-10', 'abc', '0', '401', '1e3']) {
      expect(parseYards(bad).error, bad).not.toBeNull();
    }
  });
  it('allows empty when optional', () => {
    expect(parseYards('', { optional: true })).toEqual({ value: null, error: null });
  });
});

describe('formatting', () => {
  it('formats score to par', () => {
    expect(formatToPar(0)).toBe('E');
    expect(formatToPar(5)).toBe('+5');
    expect(formatToPar(-2)).toBe('-2');
  });
  it('shows negative handicaps as plus handicaps', () => {
    expect(formatHandicap(12.34)).toBe('12.3');
    expect(formatHandicap(-1.5)).toBe('+1.5');
    expect(formatHandicap(0)).toBe('0.0');
  });
});
