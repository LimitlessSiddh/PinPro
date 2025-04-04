// src/controllers/authController.ts

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { verifyFirebaseToken } from '../firebaseAdmin';


const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const register = async (req: Request, res: Response): Promise<void> => {
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

const login = async (req: Request, res: Response): Promise<void> => {
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

const syncFirebaseUser = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Missing Firebase token' });
    return;
  }

  const decoded = await verifyFirebaseToken(token);
  if (!decoded) {
    res.status(403).json({ error: 'Invalid Firebase token' });
    return;
  }

  const uid = decoded.uid;
  const email = decoded.email;

  if (!uid || !email) {
    res.status(400).json({ error: 'Missing Firebase user data in token' });
    return;
  }

  try {
    const existing = await pool.query(
      'SELECT id, username FROM users WHERE firebase_uid = $1',
      [uid]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      res.status(200).json({ userId: user.id, username: user.username });
      return;
    }

    const insertResult = await pool.query(
      `INSERT INTO users (username, firebase_uid)
       VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING
       RETURNING id, username`,
      [email, uid]
    );

    if (insertResult.rows.length > 0) {
      const user = insertResult.rows[0];
      res.status(201).json({ userId: user.id, username: user.username });
      return;
    }

    const fallback = await pool.query(
      'SELECT id, username FROM users WHERE username = $1',
      [email]
    );

    if (fallback.rows.length > 0) {
      const user = fallback.rows[0];
      await pool.query(
        'UPDATE users SET firebase_uid = $1 WHERE id = $2',
        [uid, user.id]
      );
      res.status(200).json({ userId: user.id, username: user.username });
      return;
    }

    throw new Error('Could not sync or resolve Firebase user.');
  } catch (error) {
    console.error('❌ Error syncing Firebase user:', error);
    res.status(500).json({ error: 'Failed to sync Firebase user' });
  }
};

export { register, login, syncFirebaseUser };
