import { Router } from 'express';
import { saveRound, getRounds } from '../controllers/roundsController';
import { verifyAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(verifyAuth);
router.get('/', getRounds);
router.post('/', saveRound);

export default router;
