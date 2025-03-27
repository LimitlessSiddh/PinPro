import { Router } from 'express';
import { register, login, syncFirebaseUser } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/sync-firebase-user', syncFirebaseUser); // ✅ Handled above

export default router;
