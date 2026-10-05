import { Request, Response } from 'express';
import { pool } from '../db';
import { estimateHandicap } from '../lib/handicap';

type Shot = { hole: number; club: string; distance: number | null };

const isInt = (n: unknown, min: number, max: number): n is number =>
  Number.isInteger(n) && (n as number) >= min && (n as number) <= max;

const isNum = (n: unknown, min: number, max: number): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;

// Returns an error message, or null when the round is complete and plausible.
export const validateRound = (body: Record<string, unknown>): string | null => {
  const { totalHoles, par, courseName, courseRating, slopeRating, shotData } = body;

  if (totalHoles !== 9 && totalHoles !== 18) return 'Rounds must be 9 or 18 holes.';
  if (typeof courseName !== 'string' || !courseName.trim()) return 'Enter the course name.';
  if (courseName.trim().length > 100) return 'Course name must be 100 characters or fewer.';
  if (!isInt(par, totalHoles * 3, totalHoles * 5)) {
    return `Par must be between ${totalHoles * 3} and ${totalHoles * 5} for ${totalHoles} holes.`;
  }
  if (!isNum(courseRating, 25, 85)) return 'Course rating must be between 25 and 85.';
  if (!isInt(slopeRating, 55, 155)) return 'Slope rating must be a whole number from 55 to 155.';

  if (!Array.isArray(shotData) || shotData.length > totalHoles * 20) {
    return 'Shot data is missing or too long.';
  }
  for (const shot of shotData as Shot[]) {
    if (!shot || !isInt(shot.hole, 1, totalHoles)) return 'Each shot needs a valid hole number.';
    if (typeof shot.club !== 'string' || !shot.club.trim() || shot.club.length > 40) {
      return 'Each shot needs a club.';
    }
    if (shot.distance !== null && !isInt(shot.distance, 1, 700)) {
      return 'Shot distances must be whole yards between 1 and 700.';
    }
  }
  for (let hole = 1; hole <= totalHoles; hole++) {
    if (!(shotData as Shot[]).some((s) => s.hole === hole)) return `Hole ${hole} has no shots.`;
  }
  return null;
};

export const saveRound = async (req: Request, res: Response): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const error = validateRound(body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  // Score is derived here, never trusted from the client.
  const shotData = (body.shotData as Shot[]).map(({ hole, club, distance }) => ({
    hole,
    club: club.trim(),
    distance,
  }));
  const shots = shotData.length;
  const par = body.par as number;

  try {
    const result = await pool.query(
      `INSERT INTO rounds
       (user_id, total_holes, shots, final_score, par, shot_data, course_name, slope_rating, course_rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        req.userId,
        body.totalHoles,
        shots,
        shots - par,
        par,
        JSON.stringify(shotData),
        (body.courseName as string).trim(),
        body.slopeRating,
        body.courseRating,
      ]
    );
    res.status(201).json({ id: result.rows[0].id, shots, finalScore: shots - par });
  } catch (err) {
    console.error('Error saving round:', err);
    res.status(500).json({ error: 'Failed to save round' });
  }
};

export const getRounds = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, total_holes, shots, final_score, par, created_at, course_name,
              course_rating, slope_rating
       FROM rounds
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC`,
      [req.userId]
    );

    // NUMERIC columns arrive as strings; normalise everything the client does maths on.
    const rounds = result.rows.map((r) => ({
      id: r.id,
      total_holes: Number(r.total_holes),
      shots: Number(r.shots),
      final_score: Number(r.final_score),
      par: Number(r.par),
      created_at: r.created_at,
      course_name: r.course_name,
      course_rating: r.course_rating === null ? null : Number(r.course_rating),
      slope_rating: r.slope_rating === null ? null : Number(r.slope_rating),
    }));

    const eligible = rounds
      .filter((r) => r.total_holes === 18 && r.course_rating && r.slope_rating)
      .map((r) => ({
        gross: r.shots,
        courseRating: r.course_rating as number,
        slopeRating: r.slope_rating as number,
      }));

    res.status(200).json({ rounds, handicap: estimateHandicap(eligible) });
  } catch (error) {
    console.error('Error fetching rounds:', error);
    res.status(500).json({ error: 'Failed to fetch round history' });
  }
};
