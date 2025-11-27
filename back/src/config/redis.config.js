import { createClient } from 'redis';

const {REDIS_HOST, REDIS_PORT} = process.env;
const redisUrl = `redis://${REDIS_HOST}:${REDIS_PORT}`;

const redisClient = createClient({
  url: redisUrl,
});


redisClient.on('error', (error) => {
  console.error('❌ Error en el cliente de Redis:', error);
});

// 3. Variable para saber si la primera conexión fue exitosa.
let isConnected = false;

// 4. Función de conexión centralizada.
export const connectToRedis = async () => {
  if (isConnected) {
    console.log(`Cliente de Redis ya está conectado en ${redisUrl}.`);
    return;
  }
  try {
    await redisClient.connect();
    console.log('✅ Cliente de Redis conectado exitosamente.');
    isConnected = true;
  } catch (error) {
    console.error('❌ No se pudo conectar con el servidor de Redis.');
    // En un caso real, podrías querer que la aplicación se detenga si Redis es crítico.
    process.exit(1);
  }
};

// 5. Exportamos la instancia del cliente directamente.
// Otros módulos lo importarán y podrán usarlo de inmediato,
// confiando en que este módulo ya manejó la conexión.
export default redisClient;