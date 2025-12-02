import express from 'express';
import dotenv from 'dotenv';
import { connectToMongo } from './config/db.config.js';
import { connectToRedis } from './config/redis.config.js';
import { initCassandra } from './logger/logger.cassandra.js';

// Importación de rutas
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/userauth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import setupRoutes from './routes/setup.routes.js';
import newsRoutes from './routes/news.routes.js'; // ← RUTAS DE NOTICIAS

import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3000; 

// Middleware CORS
app.use(cors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

app.use(express.json());
app.set('etag', false);

// Montar Rutas
app.use('/api/auth', authRoutes); 
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/news', newsRoutes); // ← RUTAS DE NOTICIAS

// Función para iniciar el servidor
async function run() {
  try {
    await connectToMongo();
    console.log('MongoDB conectado');
    
    await connectToRedis();
    console.log('Redis conectado');

    await initCassandra();
    console.log('Cassandra inicializada');

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch(error) {
    console.log("Falló el arranque de los servidores", error);
    process.exit(1);
  }
}

run();

