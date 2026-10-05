import { Router } from 'express';
import { saveClubs, getClubs } from '../controllers/clubsController';
import { verifyAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(verifyAuth);
router.get('/', getClubs);
router.put('/', saveClubs);

export default router;
