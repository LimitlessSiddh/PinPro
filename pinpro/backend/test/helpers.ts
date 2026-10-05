import { AddressInfo } from 'node:net';
import { Server } from 'node:http';

// Hard stop: these tests TRUNCATE tables, so they must never point at a real database.
if (!process.env.DATABASE_URL?.includes('pinpro_test')) {
  throw new Error('Refusing to run: DATABASE_URL must point at the pinpro_test database');
}
process.env.JWT_SECRET = 'test-secret';

import { app } from '../src/app';
import { pool } from '../src/db';

export { pool };

export const startServer = async (): Promise<{ url: string; close: () => Promise<void> }> => {
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
};

export const resetDb = () =>
  pool.query('TRUNCATE rounds, clubs, users RESTART IDENTITY CASCADE');

export const api = async (
  base: string,
  method: string,
  path: string,
  body?: unknown,
  token?: string
) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

export const registerUser = async (base: string, username: string) => {
  const res = await api(base, 'POST', '/api/auth/register', { username, password: 'password123' });
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`);
  return res.body as { token: string; user: { id: number; username: string } };
};

// A complete, valid round with one shot per hole plus two putts per hole.
export const validRound = (totalHoles: 9 | 18, overrides: Record<string, unknown> = {}) => ({
  totalHoles,
  par: totalHoles * 4,
  courseName: 'Test Links',
  courseRating: totalHoles === 18 ? 72 : 36,
  slopeRating: 113,
  shotData: Array.from({ length: totalHoles }, (_, i) => [
    { hole: i + 1, club: '7 Iron', distance: 150 },
    { hole: i + 1, club: 'Putter', distance: null },
    { hole: i + 1, club: 'Putter', distance: null },
  ]).flat(),
  ...overrides,
});
