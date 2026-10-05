import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import clubsRouter from './routes/clubs';
import roundsRouter from './routes/rounds';
import authRouter from './routes/auth';

const allowedOrigins = ['https://pin-pro.vercel.app'];

export const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const localDev = process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin ?? '');
    // Unknown origins get no CORS headers, so the browser blocks the response.
    callback(null, !origin || allowedOrigins.includes(origin) || localDev);
  },
}));

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/clubs', clubsRouter);
app.use('/api/rounds', roundsRouter);
app.use('/api/auth', authRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Malformed JSON and anything a handler throws end up here instead of an HTML stack trace.
app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Request body must be valid JSON' });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});
