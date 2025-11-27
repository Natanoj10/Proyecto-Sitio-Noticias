import { Router } from 'express';
import authMiddleware from '../middlewares/userauth.middleware.js';

const router = Router();

// [GET] /api/user/profile (Ruta Protegida)
// Solo se puede acceder si el token es válido y no está en la lista negra
router.get('/profile', authMiddleware, (req, res) => {
    // req.user contiene el ID y el rol decodificados del JWT gracias al middleware
    res.status(200).json({
        message: 'Acceso a la información del perfil exitoso',
        user: {
            id: req.user.id,
            email: req.user.email, // Si lo incluyes en el JWT
            role: req.user.role,
        },
        tokenValid: true
    });
});

export default router;
