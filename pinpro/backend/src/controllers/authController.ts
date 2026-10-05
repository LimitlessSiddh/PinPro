import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db';
import { verifyFirebaseToken } from '../firebaseAdmin';
import { signSession } from '../lib/jwt';

// No '@': Google accounts use the email as username, so password accounts must never collide with one.
const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,30}$/;
const MIN_PASSWORD = 8;

type UserRow = { id: number; username: string };

const sendSession = (res: Response, status: number, user: UserRow): void => {
  res.status(status).json({
    token: signSession(user.id),
    user: { id: user.id, username: user.username },
  });
};

const register = async (req: Request, res: Response): Promise<void> => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!USERNAME_PATTERN.test(username)) {
    res.status(400).json({
      error: 'Username must be 3–30 characters: letters, numbers, dots, dashes or underscores.',
    });
    return;
  }
  if (password.length < MIN_PASSWORD) {
    res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters.` });
    return;
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query<UserRow>(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hashed]
    );
    sendSession(res, 201, result.rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'That username is taken.' });
    } else {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

const login = async (req: Request, res: Response): Promise<void> => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!username || !password) {
    res.status(400).json({ error: 'Enter your username and password.' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username]
    );
    const user = result.rows[0];
    // Google-only accounts have no password hash and can't log in this way.
    const match = user?.password_hash ? await bcrypt.compare(password, user.password_hash) : false;

    if (!match) {
      res.status(401).json({ error: 'Incorrect username or password.' });
      return;
    }
    sendSession(res, 200, user);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const syncFirebaseUser = async (req: Request, res: Response): Promise<void> => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    res.status(401).json({ error: 'Missing Google sign-in token.' });
    return;
  }

  const decoded = await verifyFirebaseToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Google sign-in could not be verified. Please try again.' });
    return;
  }

  const { uid, email } = decoded;
  if (!uid || !email || decoded.email_verified !== true) {
    res.status(403).json({ error: 'Your Google account needs a verified email address.' });
    return;
  }

  try {
    const byUid = await pool.query<UserRow>(
      'SELECT id, username FROM users WHERE firebase_uid = $1',
      [uid]
    );
    if (byUid.rows.length > 0) {
      sendSession(res, 200, byUid.rows[0]);
      return;
    }

    const inserted = await pool.query<UserRow>(
      `INSERT INTO users (username, firebase_uid)
       VALUES ($1, $2)
       ON CONFLICT (username) DO NOTHING
       RETURNING id, username`,
      [email, uid]
    );
    if (inserted.rows.length > 0) {
      sendSession(res, 201, inserted.rows[0]);
      return;
    }

    // The email is already a username owned by another account. Linking it would hand that
    // account to whoever signs in with Google (or vice versa), so refuse instead.
    res.status(409).json({
      error: 'An account with this email already exists. Log in with your username and password.',
    });
  } catch (error) {
    console.error('Error syncing Firebase user:', error);
    res.status(500).json({ error: 'Failed to sync Google account' });
  }
};

export { register, login, syncFirebaseUser };
