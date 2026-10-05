import { describe, expect, it } from 'vitest';
import { defaultSetup, validateSetup } from './round';

describe('validateSetup', () => {
  it('accepts defaults with a course name', () => {
    const { setup, errors } = validateSetup({ courseName: ' Pebble Beach ', ...defaultSetup(18) });
    expect(errors).toEqual({});
    expect(setup).toEqual({ courseName: 'Pebble Beach', totalHoles: 18, par: 72, courseRating: 72, slopeRating: 113 });
  });

  it('rejects an empty or whitespace course name (reported bug)', () => {
    expect(validateSetup({ courseName: '   ', ...defaultSetup(9) }).errors.courseName).toBeTruthy();
  });

  it('checks par, rating and slope ranges per hole count', () => {
    const { errors } = validateSetup({
      courseName: 'X',
      totalHoles: 9,
      par: '72',
      courseRating: '120',
      slopeRating: '113.5',
    });
    expect(Object.keys(errors).sort()).toEqual(['courseRating', 'par', 'slopeRating']);
  });
});
