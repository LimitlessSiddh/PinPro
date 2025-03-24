import { Request, Response } from 'express';
import { pool } from '../db';

export const saveRound = async (req: Request, res: Response): Promise<void> => {
  const { userId, totalHoles, shots, finalScore, par, shotData } = req.body;

  if (!userId || !totalHoles || !shots || finalScore === undefined || !par) {
    res.status(400).json({ error: 'Missing required round data' });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO rounds (user_id, total_holes, shots, final_score, par, shot_data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, totalHoles, shots, finalScore, par, JSON.stringify(shotData)]
    );

    res.status(200).json({ message: 'Round saved successfully' });
  } catch (error) {
    console.error('Error saving round:', error);
    res.status(500).json({ error: 'Failed to save round' });
  }
};

export const getRounds = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
  
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
  
    try {
      const result = await pool.query(
        'SELECT id, total_holes, shots, final_score, par, created_at FROM rounds WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching rounds:', error);
      res.status(500).json({ error: 'Failed to fetch round history' });
    }
  };
  