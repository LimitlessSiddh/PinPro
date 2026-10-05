import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateHandicap, scoreDifferential } from '../src/lib/handicap';

const r = (gross: number, courseRating = 72, slopeRating = 113) => ({ gross, courseRating, slopeRating });

test('differential = 113/slope × (gross − rating), rounded to 0.1', () => {
  assert.equal(scoreDifferential(r(90)), 18); // 113/113 × 18
  assert.equal(scoreDifferential(r(90, 72, 130)), 15.6); // 0.8692 × 18 = 15.646
  assert.equal(scoreDifferential(r(70, 72.5, 125)), -2.3); // 0.904 × −2.5 = −2.26
});

test('needs at least 3 rounds', () => {
  const est = estimateHandicap([r(90), r(85)]);
  assert.equal(est.value, null);
  assert.equal(est.roundsConsidered, 2);
});

test('3 rounds: lowest 1 differential minus 2.0', () => {
  // differentials 18, 13, 23 → 13 − 2 = 11
  assert.equal(estimateHandicap([r(90), r(85), r(95)]).value, 11);
});

test('6 rounds: average of lowest 2 minus 1.0', () => {
  // differentials 10,12,14,16,18,20 → (10+12)/2 − 1 = 10
  assert.equal(estimateHandicap([82, 84, 86, 88, 90, 92].map((g) => r(g))).value, 10);
});

test('20 rounds: average of lowest 8', () => {
  // differentials 1..20 → mean(1..8) = 4.5
  const est = estimateHandicap(Array.from({ length: 20 }, (_, i) => r(73 + i)));
  assert.equal(est.value, 4.5);
  assert.equal(est.roundsUsed, 8);
});

test('only the 20 most recent rounds count', () => {
  // newest 20 have differentials 10..29; 5 older excellent rounds (diff 0) are ignored
  const recent = Array.from({ length: 20 }, (_, i) => r(82 + i));
  const old = Array.from({ length: 5 }, () => r(72));
  const est = estimateHandicap([...recent, ...old]);
  assert.equal(est.value, 13.5); // mean(10..17)
  assert.equal(est.roundsConsidered, 20);
});

test('capped at 54.0', () => {
  assert.equal(estimateHandicap([r(200), r(200), r(200)]).value, 54);
});
