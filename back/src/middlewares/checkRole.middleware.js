import jwt from 'jsonwebtoken';

const checkRole = (requiredRoles) => (req, res, next) => {

    if (!req.user || !req.user.role) {

        return res.status(401).json({ message: 'Acceso Denegado. Información de autenticación incompleta.' });
    }

    const userRole = req.user.role;

    if (requiredRoles.includes(userRole)) {

        next();
    } else {
        // Rol no autorizado (ej: si requiredRoles es ['admin'] y el rol es 'user').
        // Enviamos 403 Forbidden para indicar que el usuario está logueado pero no tiene permisos.
        res.status(403).json({ 
            message: `Acceso Denegado. Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}. Su rol actual es: ${userRole}`
        });
    }
};

export default checkRole;