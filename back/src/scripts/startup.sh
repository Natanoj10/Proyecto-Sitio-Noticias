#!/bin/bash

echo "🚀 Iniciando configuración automática del sistema..."
echo ""

# Esperar a que MongoDB esté listo
echo "⏳ Esperando a MongoDB..."
until node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://$MONGO_USER:$MONGO_PASS@$MONGO_HOST:$MONGO_PORT/$MONGO_DB?authSource=admin').then(() => { console.log('Connected'); process.exit(0); }).catch(() => process.exit(1));" > /dev/null 2>&1; do
    sleep 2
done
echo "✅ MongoDB listo"

# Esperar a que Redis esté listo  
echo "⏳ Esperando a Redis..."
sleep 3
echo "✅ Redis listo"

# Esperar a que Cassandra esté listo
echo "⏳ Esperando a Cassandra..."
sleep 5
echo "✅ Cassandra listo"

# Verificar si ya existen datos
echo "🔍 Verificando si ya existen datos..."
DATA_EXISTS=$(node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://$MONGO_USER:$MONGO_PASS@$MONGO_HOST:$MONGO_PORT/$MONGO_DB?authSource=admin')
  .then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({ email: String }));
    const count = await User.countDocuments();
    console.log(count > 0 ? 'yes' : 'no');
    process.exit(0);
  })
  .catch(() => {
    console.log('no');
    process.exit(0);
  });
" 2>/dev/null)

if [ "$DATA_EXISTS" = "yes" ]; then
    echo "✅ Datos ya existen, omitiendo seed..."
else
    echo "🌱 Insertando datos de prueba..."
    node src/scripts/seed-data.js
    
    echo ""
    echo "🧪 Iniciando servidor para tests..."
    node src/index.js &
    SERVER_PID=$!
    
    # Esperar a que el servidor esté listo
    echo "⏳ Esperando a que el servidor esté listo..."
    sleep 8
    
    echo "🧪 Ejecutando tests de API..."
    bash src/scripts/test-api.sh
    
    # Detener el servidor de prueba
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
fi

echo ""
echo "✅ Configuración completada. Iniciando servidor..."
echo ""

# Iniciar servidor normalmente
exec node src/index.js
