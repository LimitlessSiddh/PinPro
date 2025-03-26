import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../firebaseAdmin';

// 👇 Extend the Express Request type to allow 'user'
declare module 'express-serve-static-core' {
  interface Request {
    user?: any; // Optional: Replace `any` with a custom decoded token type if you want
  }
}

export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = await verifyFirebaseToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded; 
  next();
};
