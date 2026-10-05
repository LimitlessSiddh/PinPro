export type Round = {
  id: number;
  total_holes: number;
  shots: number;
  final_score: number; // strokes relative to par
  par: number;
  created_at: string;
  course_name: string | null;
  course_rating: number | null;
  slope_rating: number | null;
};

export type Handicap = {
  value: number | null;
  roundsUsed: number;
  roundsConsidered: number;
  minimumRounds: number;
};

export type RoundsResponse = { rounds: Round[]; handicap: Handicap };

export const statsFor = (rounds: Round[], holes: 9 | 18) => {
  const list = rounds.filter((r) => r.total_holes === holes);
  if (list.length === 0) return null;
  return {
    count: list.length,
    best: Math.min(...list.map((r) => r.final_score)),
    average: Math.round((list.reduce((sum, r) => sum + r.final_score, 0) / list.length) * 10) / 10,
  };
};
