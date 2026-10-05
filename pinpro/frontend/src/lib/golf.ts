// Must match CLUB_NAMES in the backend (pinpro/backend/src/lib/clubs.ts).
export const CLUB_GROUPS = [
  { label: 'Woods & hybrids', clubs: ['Driver', '3 Wood', 'Hybrid'] },
  { label: 'Irons', clubs: ['4 Iron', '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron'] },
  { label: 'Wedges', clubs: ['Pitching Wedge', 'Sand Wedge', 'Lob Wedge'] },
] as const;
export const CLUBS: string[] = CLUB_GROUPS.flatMap((g) => [...g.clubs]);
export const MAX_CLUB_YARDS = 400;
export const SHORT_GAME_YARDS = 30;

export type Yardages = Record<string, number>;

export type Suggestion =
  | { kind: 'fit'; club: string; yards: number }
  | { kind: 'max'; club: string; yards: number }
  | { kind: 'short' };

// Parses a typed whole-yard value. Empty is allowed when `optional`.
export const parseYards = (
  input: string,
  { min = 1, max = MAX_CLUB_YARDS, optional = false } = {}
): { value: number | null; error: string | null } => {
  const text = input.trim();
  if (text === '') {
    return optional ? { value: null, error: null } : { value: null, error: 'Enter a distance in yards.' };
  }
  if (!/^\d+$/.test(text)) return { value: null, error: 'Use whole yards, e.g. 150.' };
  const value = Number(text);
  if (value < min || value > max) {
    return { value: null, error: `Enter a distance between ${min} and ${max} yards.` };
  }
  return { value, error: null };
};

// Picks the shortest saved club that carries at least `distance`. Returns null when no clubs are saved.
// This is a lookup against the player's own yardages, nothing more.
export const suggestClub = (distance: number, yardages: Yardages): Suggestion | null => {
  const clubs = Object.entries(yardages)
    .filter(([, yards]) => Number.isFinite(yards) && yards > 0)
    .sort((a, b) => a[1] - b[1]);
  if (clubs.length === 0) return null;
  if (distance <= SHORT_GAME_YARDS) return { kind: 'short' };

  const fit = clubs.find(([, yards]) => yards >= distance);
  if (fit) return { kind: 'fit', club: fit[0], yards: fit[1] };
  const [club, yards] = clubs[clubs.length - 1];
  return { kind: 'max', club, yards };
};

export const formatToPar = (score: number): string =>
  score === 0 ? 'E' : score > 0 ? `+${score}` : `${score}`;

// WHS convention: a negative index is a "plus" handicap.
export const formatHandicap = (value: number): string =>
  value < 0 ? `+${Math.abs(value).toFixed(1)}` : value.toFixed(1);
