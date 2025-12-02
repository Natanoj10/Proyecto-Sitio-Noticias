import { Router } from 'express';
import authMiddleware from '../middlewares/userauth.middleware.js';
import checkRole from '../middlewares/checkRole.middleware.js';
import {
    getAllNews,
    getNewsById,
    createNews,
    updateNews,
    deleteNews,
    toggleLike,
    getMyNews,
    getAllNewsForManagement
} from '../controllers/news.controller.js';

const router = Router();

// ===== RUTAS PÚBLICAS =====
// [GET] /api/news - Obtener todas las noticias publicadas
router.get('/', getAllNews);

// ===== RUTAS PROTEGIDAS (requieren autenticación) =====
// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros

// [GET] /api/news/my/articles - Obtener mis noticias (editor o admin)
router.get('/my/articles', authMiddleware, checkRole(['editor', 'admin']), getMyNews);

// [GET] /api/news/all/manage - Obtener todas las noticias para administración (solo admin)
router.get('/all/manage', authMiddleware, checkRole(['admin']), getAllNewsForManagement);

// [GET] /api/news/:id - Obtener una noticia específica por ID
router.get('/:id', getNewsById);

// [POST] /api/news/:id/like - Dar o quitar like (solo usuarios autenticados)
router.post('/:id/like', authMiddleware, toggleLike);

// [POST] /api/news - Crear nueva noticia (editor o admin)
router.post('/', authMiddleware, checkRole(['editor', 'admin']), createNews);

// [PUT] /api/news/:id - Actualizar noticia (editor o admin)
router.put('/:id', authMiddleware, checkRole(['editor', 'admin']), updateNews);

// [DELETE] /api/news/:id - Eliminar noticia (solo admin)
router.delete('/:id', authMiddleware, checkRole(['admin']), deleteNews);

export default router;
