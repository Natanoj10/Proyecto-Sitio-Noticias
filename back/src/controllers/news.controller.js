import News from '../models/news.model.js';
import User from '../models/userauth.model.js';
import { logEvent } from '../logger/logger.cassandra.js';

// [GET] /api/news - Obtener todas las noticias publicadas (público)
export const getAllNews = async (req, res) => {
    try {
        const { category, limit = 20, skip = 0 } = req.query;
        
        const filter = { published: true };
        if (category && category !== 'todas') {
            filter.category = category;
        }

        const news = await News.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .select('-__v');

        const total = await News.countDocuments(filter);

        res.status(200).json({
            news,
            total,
            hasMore: (parseInt(skip) + news.length) < total
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener las noticias.', 
            error: error.message 
        });
    }
};

// [GET] /api/news/:id - Obtener una noticia específica (público)
export const getNewsById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const news = await News.findById(id);
        
        if (!news) {
            return res.status(404).json({ message: 'Noticia no encontrada.' });
        }

        // Incrementar vistas
        news.views += 1;
        await news.save();

        res.status(200).json(news);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener la noticia.', 
            error: error.message 
        });
    }
};

// [POST] /api/news - Crear nueva noticia (requiere autenticación: editor o admin)
export const createNews = async (req, res) => {
    try {
        const { title, content, summary, category, imageUrl, published } = req.body;
        const userId = req.user.id;

        // Obtener información del autor
        const user = await User.findById(userId).select('email');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const newNews = new News({
            title,
            content,
            summary,
            category,
            imageUrl,
            published: published || false,
            author: userId,
            authorName: user.email
        });

        await newNews.save();

        // Log del evento
        await logEvent({
            userId: userId,
            action: 'CREATE',
            entity: 'news',
            entityId: newNews._id.toString(),
            details: `Noticia creada: "${title}"`,
            ip: req.ip || null
        });

        res.status(201).json({
            message: 'Noticia creada exitosamente.',
            news: newNews
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al crear la noticia.', 
            error: error.message 
        });
    }
};

// [PUT] /api/news/:id - Actualizar noticia (requiere autenticación: editor o admin)
export const updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, summary, category, imageUrl, published } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        const news = await News.findById(id);
        
        if (!news) {
            return res.status(404).json({ message: 'Noticia no encontrada.' });
        }

        // Solo el autor o un admin pueden editar
        if (news.author.toString() !== userId && userRole !== 'admin') {
            return res.status(403).json({ 
                message: 'No tienes permiso para editar esta noticia.' 
            });
        }

        // Actualizar campos
        if (title !== undefined) news.title = title;
        if (content !== undefined) news.content = content;
        if (summary !== undefined) news.summary = summary;
        if (category !== undefined) news.category = category;
        if (imageUrl !== undefined) news.imageUrl = imageUrl;
        if (published !== undefined) news.published = published;

        await news.save();

        // Log del evento
        await logEvent({
            userId: userId,
            action: 'UPDATE',
            entity: 'news',
            entityId: news._id.toString(),
            details: `Noticia actualizada: "${news.title}"`,
            ip: req.ip || null
        });

        res.status(200).json({
            message: 'Noticia actualizada exitosamente.',
            news
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al actualizar la noticia.', 
            error: error.message 
        });
    }
};

// [DELETE] /api/news/:id - Eliminar noticia (requiere autenticación: admin)
export const deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const news = await News.findByIdAndDelete(id);
        
        if (!news) {
            return res.status(404).json({ message: 'Noticia no encontrada.' });
        }

        // Log del evento
        await logEvent({
            userId: userId,
            action: 'DELETE',
            entity: 'news',
            entityId: id,
            details: `Noticia eliminada: "${news.title}"`,
            ip: req.ip || null
        });

        res.status(200).json({ 
            message: 'Noticia eliminada exitosamente.' 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al eliminar la noticia.', 
            error: error.message 
        });
    }
};

// [POST] /api/news/:id/like - Dar/quitar like a una noticia (requiere autenticación)
export const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const news = await News.findById(id);
        
        if (!news) {
            return res.status(404).json({ message: 'Noticia no encontrada.' });
        }

        const likeIndex = news.likes.indexOf(userId);
        let action;

        if (likeIndex === -1) {
            // Agregar like
            news.likes.push(userId);
            news.likesCount += 1;
            action = 'LIKE';
        } else {
            // Quitar like
            news.likes.splice(likeIndex, 1);
            news.likesCount -= 1;
            action = 'UNLIKE';
        }

        await news.save();

        // Log del evento
        await logEvent({
            userId: userId,
            action: action,
            entity: 'news',
            entityId: news._id.toString(),
            details: `${action} en noticia: "${news.title}"`,
            ip: req.ip || null
        });

        res.status(200).json({
            message: action === 'LIKE' ? 'Like agregado.' : 'Like removido.',
            likes: news.likesCount,
            liked: action === 'LIKE'
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al procesar el like.', 
            error: error.message 
        });
    }
};

// [GET] /api/news/my/articles - Obtener noticias del usuario autenticado
export const getMyNews = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const news = await News.find({ author: userId })
            .sort({ createdAt: -1 })
            .select('-__v');

        res.status(200).json({ news });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener tus noticias.', 
            error: error.message 
        });
    }
};

// [GET] /api/news/all/manage - Obtener todas las noticias para gestión (admin)
export const getAllNewsForManagement = async (req, res) => {
    try {
        const news = await News.find()
            .sort({ createdAt: -1 })
            .select('-__v');

        res.status(200).json({ news });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener las noticias.', 
            error: error.message 
        });
    }
};
