import jwt from 'jsonwebtoken';

const SESSION_TTL = '7d'; // long enough that a session can't expire mid-round

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (value) return value;
  // Render sets RENDER but not NODE_ENV; never fall back to the public dev secret there.
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    throw new Error('JWT_SECRET must be set in production');
  }
  return 'dev_secret_not_for_production';
}

export const signSession = (userId: number): string =>
  jwt.sign({ userId }, secret(), { expiresIn: SESSION_TTL });

export const verifySession = (token: string): number | null => {
  try {
    const payload = jwt.verify(token, secret());
    const userId = typeof payload === 'object' ? Number(payload.userId) : NaN;
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
};

// Fail at boot rather than on the first login.
export const assertJwtConfigured = (): void => {
  secret();
};
