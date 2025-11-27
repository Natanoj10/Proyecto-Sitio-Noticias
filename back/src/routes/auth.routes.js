import { Router } from 'express';
import { loginUser, logoutUser, registerUser } from '../controllers/userauth.controller.js';

const router = Router();

// Rutas de autenticación públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

export default router;