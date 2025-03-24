import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

router.post('/register', (req, res) => {
  void register(req, res);
});

router.post('/login', (req, res) => {
  void login(req, res);
});

export default router;
