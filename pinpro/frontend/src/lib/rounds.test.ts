import { expect, it } from 'vitest';
import { statsFor, type Round } from './rounds';

const round = (total_holes: number, final_score: number) => ({ total_holes, final_score }) as Round;

it('keeps 9- and 18-hole stats separate', () => {
  const rounds = [round(18, 10), round(18, 4), round(9, 2), round(18, 7)];
  expect(statsFor(rounds, 18)).toEqual({ count: 3, best: 4, average: 7 });
  expect(statsFor(rounds, 9)).toEqual({ count: 1, best: 2, average: 2 });
});

it('returns null with no rounds of that length', () => {
  expect(statsFor([round(9, 1)], 18)).toBeNull();
});
