import { Router, Request, Response } from 'express';
import { saveRound, getRounds } from '../controllers/roundsController';

const router = Router();

router.post('/save', (req: Request, res: Response) => {
  void saveRound(req, res);
});

router.get('/:userId', (req: Request, res: Response) => {
  void getRounds(req, res);
});




export default router;
