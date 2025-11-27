import { Router } from 'express';
import User from '../models/userauth.model.js';

const router = Router();

// [POST] /api/setup/first-admin
// Esta ruta solo debe usarse UNA VEZ para crear el primer administrador
// Después de usarla, deberías comentarla o eliminarla por seguridad
const {CLAVE} = process.env;
router.post('/first-admin', async (req, res) => {
    try {
        const { email, password, secretKey } = req.body;

        // 1. Verificar que se proporcione una clave secreta (seguridad básica)
        // Cambia 'MI_CLAVE_SUPER_SECRETA_123' por algo que solo tú sepas
        
        if (secretKey !== CLAVE) {
            return res.status(403).json({ 
                message: 'Clave secreta incorrecta. No tienes autorización para crear un admin.' 
            });
        }

        // 2. Verificar que no existan admins ya
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            return res.status(400).json({ 
                message: 'Ya existe un administrador. Esta ruta está deshabilitada por seguridad.' 
            });
        }

        // 3. Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            // Si existe, actualizar su rol a admin
            existingUser.role = 'admin';
            await existingUser.save();
            
            return res.status(200).json({ 
                message: `Usuario ${email} actualizado a administrador.`,
                user: { id: existingUser._id, email: existingUser.email, role: existingUser.role }
            });
        } else {
            // Si no existe, crear nuevo usuario con rol admin
            const newAdmin = new User({ 
                email, 
                password,
                role: 'admin' 
            });
            await newAdmin.save();

            return res.status(201).json({ 
                message: 'Primer administrador creado exitosamente.',
                user: { id: newAdmin._id, email: newAdmin.email, role: newAdmin.role }
            });
        }

    } catch (error) {
        res.status(500).json({ 
            message: 'Error al crear el administrador.', 
            error: error.message 
        });
    }
});

export default router;