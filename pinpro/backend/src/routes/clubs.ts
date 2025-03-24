import { Router, Request, Response } from 'express';
import { saveClubs, getClubs } from '../controllers/clubsController';

const router = Router();

// Save club setup to PostgreSQL
router.post('/save', (req: Request, res: Response) => {
  saveClubs(req, res);
});

// Get club setup by userId from PostgreSQL
router.get('/:userId', (req: Request, res: Response) => {
  getClubs(req, res);
});

export default router;
