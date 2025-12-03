import { Client } from 'cassandra-driver';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    contactPoints: [process.env.CASSANDRA_HOST || 'cassandra'],
    localDataCenter: process.env.CASSANDRA_DC || 'datacenter1',
    keyspace: 'news_app_logs'
});

async function initCassandra() {
    // Conectar al cluster sin keyspace primero
    const setupClient = new Client({
        contactPoints: [process.env.CASSANDRA_HOST || 'cassandra'],
        localDataCenter: process.env.CASSANDRA_DC || 'datacenter1'
    });

    try {
        await setupClient.connect();
        console.log('Cassandra conectada, inicializando keyspace y tabla...');

        // Crear keyspace si no existe
        await setupClient.execute(`
            CREATE KEYSPACE IF NOT EXISTS news_app_logs 
            WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
        `);

        // Crear tabla si no existe
        await setupClient.execute(`
            CREATE TABLE IF NOT EXISTS news_app_logs.app_logs (
                event_id uuid PRIMARY KEY,
                user_id text,
                timestamp timestamp,
                action text,
                entity text,
                entity_id text,
                details text,
                ip_address text
            )
        `);

        await setupClient.shutdown();
        console.log('Keyspace y tabla de Cassandra inicializados');

        // Conectar al cliente principal con el keyspace
        await client.connect();
        console.log('Cliente de Cassandra listo');
    } catch (error) {
        console.error('Error al inicializar Cassandra:', error);
        throw error;
    }
}

async function logEvent({ userId = null, action, entity = null, entityId = null, details = null, ip = null }) {
    const query = `
    INSERT INTO app_logs (event_id, user_id, timestamp, action, entity, entity_id, details, ip_address)
    VALUES (uuid(), ?, toTimestamp(now()), ?, ?, ?, ?, ?)
  `;
    const params = [userId, action, entity, entityId, details, ip];
    await client.execute(query, params, { prepare: true });
}

export { client, initCassandra, logEvent };
