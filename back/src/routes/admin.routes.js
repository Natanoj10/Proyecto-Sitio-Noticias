import { Router } from 'express';
// FIX: Asegurar que la ruta a User.model.js incluya la extensión .js
import User from '../models/userauth.model.js'; 
import authMiddleware from '../middlewares/userauth.middleware.js';
import checkRole from '../middlewares/checkRole.middleware.js';

const router = Router();

// Middleware de autenticación y rol para todas las rutas de administración
// Estas rutas requieren que el usuario sea Admin
router.use(authMiddleware, checkRole(['admin']));

// [GET] /api/admin/users: Obtener la lista de todos los usuarios (solo Admin)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Excluir la contraseña
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios.', error: error.message });
    }
});

// [PATCH] /api/admin/role/:userId: Cambiar el rol de un usuario (solo Admin)
router.patch('/role/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { newRole } = req.body; // Esperamos { "newRole": "editor" }

        // 1. Validar el nuevo rol
        if (!['admin', 'editor', 'user'].includes(newRole)) {
            return res.status(400).json({ message: 'Rol inválido especificado. Roles permitidos: admin, editor, user.' });
        }
        
        // 2. Prevenir que un admin se auto-degrade (opcional)
        if (req.user.id.toString() === userId && newRole !== 'admin') {
            return res.status(403).json({ message: 'Un administrador no puede degradarse a sí mismo.' });
        }

        // 3. Actualizar el rol del usuario
        const user = await User.findByIdAndUpdate(
            userId,
            { role: newRole },
            { new: true, select: 'email role' } 
        );

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({ 
            message: `Rol de ${user.email} actualizado a ${user.role}.`,
            user: { id: user._id, email: user.email, role: user.role }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el rol.', error: error.message });
    }
});

// [DELETE] /api/admin/user/:userId: Eliminar un usuario (solo Admin)
router.delete('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // 1. Prevenir que el admin se auto-elimine
        if (req.user.id.toString() === userId) {
            return res.status(403).json({ message: 'Un administrador no puede auto-eliminarse.' });
        }

        // 2. Eliminar el usuario
        const result = await User.findByIdAndDelete(userId);

        if (!result) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({ 
            message: `Usuario con ID ${userId} eliminado exitosamente.`,
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el usuario.', error: error.message });
    }
});

export default router;