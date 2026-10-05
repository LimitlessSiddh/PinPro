import { Request, Response } from 'express';
import { pool } from '../db';
import { CLUB_NAMES, MAX_CLUB_YARDS } from '../lib/clubs';

type ClubSetup = Record<string, number>;

// Returns an error message, or null when every entry is a known club with a whole-yard distance.
const validateClubs = (clubs: unknown): string | null => {
  if (!clubs || typeof clubs !== 'object' || Array.isArray(clubs)) {
    return 'clubs must be an object of club name to yards';
  }
  for (const [name, yards] of Object.entries(clubs)) {
    if (!(CLUB_NAMES as readonly string[]).includes(name)) return `Unknown club: ${name}`;
    if (!Number.isInteger(yards) || (yards as number) < 1 || (yards as number) > MAX_CLUB_YARDS) {
      return `${name} must be a whole number of yards between 1 and ${MAX_CLUB_YARDS}`;
    }
  }
  return null;
};

export const saveClubs = async (req: Request, res: Response): Promise<void> => {
  const clubs = req.body?.clubs as ClubSetup;
  const error = validateClubs(clubs);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  // Replace the whole set atomically so a failed insert can't leave the user with no clubs.
  const client = await pool.connect().catch(() => null);
  if (!client) {
    res.status(503).json({ error: 'Database unavailable. Please try again.' });
    return;
  }
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM clubs WHERE user_id = $1', [req.userId]);
    for (const [name, distance] of Object.entries(clubs)) {
      await client.query(
        'INSERT INTO clubs (user_id, name, distance) VALUES ($1, $2, $3)',
        [req.userId, name, distance]
      );
    }
    await client.query('COMMIT');
    res.status(200).json({ clubs });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.error('Error saving clubs:', err);
    res.status(500).json({ error: 'Failed to save clubs' });
  } finally {
    client.release();
  }
};

export const getClubs = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT name, distance FROM clubs WHERE user_id = $1',
      [req.userId]
    );

    // NUMERIC columns come back from pg as strings; the client needs numbers.
    const clubs: ClubSetup = {};
    for (const row of result.rows) {
      const yards = Number(row.distance);
      if (yards > 0) clubs[row.name] = yards;
    }
    res.status(200).json({ clubs });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
};
