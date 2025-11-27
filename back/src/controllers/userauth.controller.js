import User from '../models/userauth.model.js';
import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.config.js';
import { logEvent } from '../logger/logger.cassandra.js';  // ← importamos logEvent

// Función auxiliar para generar JWT
const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET || 'mi_secreto_seguro', {
        expiresIn: '72h'
    });
};

// [POST] /api/auth/register
export const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario con este email ya existe.' });
        }

        const newUser = new User({ email, password });
        await newUser.save();

        const token = generateToken(newUser._id, newUser.role);

        // — LOG DE EVENTO: registro de usuario
        await logEvent({
            userId: newUser._id.toString(),
            action: 'REGISTER',
            entity: 'user',
            entityId: newUser._id.toString(),
            details: `Usuario registrado con email ${newUser.email}`,
            ip: req.ip || null
        });

        res.status(201).json({
            message: 'Registro exitoso',
            token,
            user: { id: newUser._id, email: newUser.email, role: newUser.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor durante el registro', error: error.message });
    }
};

// [POST] /api/auth/login
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Credenciales inválidas.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const token = generateToken(user._id, user.role);

        const profileKey = `user:${user._ordered_id}`;
        await redisClient.set(profileKey, JSON.stringify({ id: user._id, email: user.email, role: user.role }), {
            EX: 3600
        });

        // — LOG DE EVENTO: login exitoso
        await logEvent({
            userId: user._id.toString(),
            action: 'LOGIN',
            entity: 'user',
            entityId: user._id.toString(),
            details: `Usuario ${user.email} inició sesión`,
            ip: req.ip || null
        });

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token,
            user: { id: user._id, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor durante el login', error: error.message });
    }
};

// [POST] /api/auth/logout
export const logoutUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.decode(token);
            const now = Math.floor(Date.now() / 1000);
            const ttl = decoded.exp - now;

            if (ttl > 0) {
                await redisClient.set(`blacklist:${token}`, 'true', { EX: ttl });
                await redisClient.del(`user:${decoded.id}`);
            }

            // — LOG DE EVENTO: logout
            await logEvent({
                userId: decoded.id,
                action: 'LOGOUT',
                entity: 'user',
                entityId: decoded.id,
                details: `Usuario con ID ${decoded.id} cerró sesión`,
                ip: req.ip || null
            });
        }

        res.status(200).json({ message: 'Cierre de sesión exitoso. Token invalidado.' });
    } catch (error) {
        res.status(200).json({ message: 'Cierre de sesión exitoso.' });
    }
};
