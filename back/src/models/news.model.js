import mongoose from 'mongoose';

const NewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es obligatorio.'],
    trim: true,
    maxlength: [200, 'El título no puede tener más de 200 caracteres.']
  },
  content: {
    type: String,
    required: [true, 'El contenido es obligatorio.'],
    trim: true
  },
  summary: {
    type: String,
    trim: true,
    maxlength: [500, 'El resumen no puede tener más de 500 caracteres.']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El autor es obligatorio.']
  },
  authorName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['política', 'deportes', 'tecnología', 'cultura', 'economía', 'internacional', 'otros'],
    default: 'otros'
  },
  imageUrl: {
    type: String,
    default: null
  },
  published: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices para mejorar rendimiento
NewsSchema.index({ published: 1, createdAt: -1 });
NewsSchema.index({ category: 1, published: 1 });
NewsSchema.index({ author: 1 });

const News = mongoose.model('News', NewsSchema);

export default News;
