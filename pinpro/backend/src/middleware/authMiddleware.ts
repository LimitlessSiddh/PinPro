import { Request, Response, NextFunction } from 'express';
import { verifySession } from '../lib/jwt';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: number;
  }
}

// Every clubs/rounds request is scoped to the user in the signed token, never a client-sent id.
export const verifyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const userId = token ? verifySession(token) : null;

  if (!userId) {
    res.status(401).json({ error: 'Your session has expired. Please log in again.' });
    return;
  }

  req.userId = userId;
  next();
};
