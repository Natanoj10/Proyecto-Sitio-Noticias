#!/bin/bash

# Script para inicializar Cassandra
echo "🔄 Esperando a que Cassandra esté listo..."

# Esperar hasta que Cassandra esté disponible
until cqlsh -e "DESC KEYSPACES" > /dev/null 2>&1; do
  echo "⏳ Cassandra no está listo aún, esperando..."
  sleep 5
done

echo "✅ Cassandra está listo, creando keyspace y tabla..."

# Crear keyspace y tabla
cqlsh <<EOF
CREATE KEYSPACE IF NOT EXISTS news_app_logs 
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE news_app_logs;

CREATE TABLE IF NOT EXISTS app_logs (
    event_id uuid PRIMARY KEY,
    user_id text,
    timestamp timestamp,
    action text,
    entity text,
    entity_id text,
    details text,
    ip_address text
);
EOF

echo "✅ Cassandra inicializado correctamente"
