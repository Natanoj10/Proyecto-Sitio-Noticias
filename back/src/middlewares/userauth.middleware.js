import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.config.js';

// Middleware que verifica el token JWT y el blacklist de Redis
const authMiddleware = async (req, res, next) => {
  // 1. Obtener el token del header Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  const token = authHeader.split(' ')[1];
  
  // 2. Verificar si el token está en la lista negra de Redis (Logout)
  try {
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Token invalidado. Por favor, inicie sesión de nuevo.' });
    }
  } catch (redisError) {
    // Si Redis falla, no bloqueamos al usuario (es mejor que funcione con un pequeño riesgo)
    console.error('Advertencia: Fallo al consultar Redis Blacklist:', redisError);
  }

  // 3. Verificar la validez del JWT
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mi_secreto_seguro');
    
    // 4. Adjuntar la información del usuario a la solicitud
    req.user = decoded; 
    
    next(); // Permite el paso a la ruta protegida

  } catch (error) {
    // Manejo de errores de JWT (token expirado, token inválido, etc.)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.' });
    }
    return res.status(401).json({ message: 'Token inválido.' });
  }
};

export default authMiddleware;