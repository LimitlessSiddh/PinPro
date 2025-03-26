// backend/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hashed]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '2h' });

    res.status(201).json({ token, userId: user.id, username: user.username });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Username already exists' });
    } else {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '2h' });

    res.status(200).json({ token, userId: user.id, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const syncFirebaseUser = async (req: Request, res: Response): Promise<void> => {
  const { uid, email } = req.body;

  if (!uid || !email) {
    res.status(400).json({ error: 'Missing Firebase user data' });
    return;
  }

  try {
    const existing = await pool.query(
      'SELECT id, username FROM users WHERE firebase_uid = $1 OR username = $2',
      [uid, email]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      res.status(200).json({ userId: user.id, username: user.username });
      return;
    }

    const result = await pool.query(
      'INSERT INTO users (username, firebase_uid) VALUES ($1, $2) RETURNING id, username',
      [email, uid]
    );

    const user = result.rows[0];
    res.status(201).json({ userId: user.id, username: user.username });
  } catch (error) {
    console.error('Error syncing Firebase user:', error);
    res.status(500).json({ error: 'Failed to sync Firebase user' });
  }
};
