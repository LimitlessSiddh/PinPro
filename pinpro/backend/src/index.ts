import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import clubsRouter from './routes/clubs';
import roundsRouter from './routes/rounds';
import authRouter from './routes/auth';

dotenv.config();

const app = express();

// ✅ Proper CORS setup
const allowedOrigins = [
  'http://localhost:5173',
  'https://pin-pro.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.use('/api/clubs', clubsRouter);
app.use('/api/rounds', roundsRouter);
app.use('/api/auth', authRouter);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
