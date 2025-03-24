import { Request, Response } from 'express';
import { pool } from '../db';

type ClubSetup = Record<string, number>;

export const saveClubs = async (req: Request, res: Response): Promise<void> => {
  const { userId, clubs } = req.body as { userId: string; clubs: ClubSetup };

  if (!userId || typeof clubs !== 'object') {
    res.status(400).json({ error: 'userId and clubs are required' });
    return;
  }

  try {
    await pool.query('DELETE FROM clubs WHERE user_id = $1', [userId]);

    const insertPromises = Object.entries(clubs).map(([name, distance]) =>
      pool.query(
        'INSERT INTO clubs (user_id, name, distance) VALUES ($1, $2, $3)',
        [userId, name, distance]
      )
    );

    await Promise.all(insertPromises);

    res.status(200).json({ message: 'Club data saved successfully' });
  } catch (error) {
    console.error('Error saving clubs:', error);
    res.status(500).json({ error: 'Failed to save clubs' });
  }
};

export const getClubs = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params as { userId: string };

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT name, distance FROM clubs WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No club data found for this user' });
      return;
    }

    const clubs: ClubSetup = {};
    result.rows.forEach((row) => {
      clubs[row.name] = row.distance;
    });

    res.status(200).json(clubs);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
};
