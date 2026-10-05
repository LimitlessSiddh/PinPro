"use strict";
// Handicap Index *estimate* modelled on World Handicap System Rule 5.2.
// Not an official index: PinPro has no per-hole pars (so no net-double-bogey cap) and no PCC.
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateHandicap = exports.scoreDifferential = void 0;
const MIN_ROUNDS = 3;
const WINDOW = 20;
const MAX_INDEX = 54;
// WHS Rule 5.2a: [rounds available] -> [lowest differentials used, adjustment]
const TABLE = {
    3: [1, -2], 4: [1, -1], 5: [1, 0], 6: [2, -1], 7: [2, 0], 8: [2, 0],
    9: [3, 0], 10: [3, 0], 11: [3, 0], 12: [4, 0], 13: [4, 0], 14: [4, 0],
    15: [5, 0], 16: [5, 0], 17: [6, 0], 18: [6, 0], 19: [7, 0], 20: [8, 0],
};
const round1 = (n) => Math.round(n * 10) / 10;
const scoreDifferential = ({ gross, courseRating, slopeRating }) => round1((113 / slopeRating) * (gross - courseRating));
exports.scoreDifferential = scoreDifferential;
// `rounds` must be newest first and 18-hole only.
const estimateHandicap = (rounds) => {
    const recent = rounds.slice(0, WINDOW);
    const base = { roundsConsidered: recent.length, minimumRounds: MIN_ROUNDS };
    if (recent.length < MIN_ROUNDS)
        return { value: null, roundsUsed: 0, ...base };
    const [used, adjustment] = TABLE[recent.length];
    const lowest = recent.map(exports.scoreDifferential).sort((a, b) => a - b).slice(0, used);
    const average = lowest.reduce((sum, d) => sum + d, 0) / used;
    return { value: Math.min(round1(average + adjustment), MAX_INDEX), roundsUsed: used, ...base };
};
exports.estimateHandicap = estimateHandicap;
