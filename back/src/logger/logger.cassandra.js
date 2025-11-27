import { Client } from 'cassandra-driver';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    contactPoints: [process.env.CASSANDRA_HOST || 'cassandra'],  // 'cassandra' debe coincidir con el servicio en docker-compose
    localDataCenter: process.env.CASSANDRA_DC || 'datacenter1',
    keyspace: 'news_app_logs'
});

async function initCassandra() {
    await client.connect();
    console.log('✅ Cassandra conectada');
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
