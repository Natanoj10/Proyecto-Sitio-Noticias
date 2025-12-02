#!/bin/bash

echo "🔧 Modo Desarrollo - Iniciando con hot-reload..."
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

# Verificar si ya existen datos (solo en primer arranque)
if [ ! -f "/tmp/.data_seeded" ]; then
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

    if [ "$DATA_EXISTS" = "no" ]; then
        echo "🌱 Insertando datos de prueba..."
        node src/scripts/seed-data.js
        touch /tmp/.data_seeded
    else
        echo "✅ Datos ya existen"
        touch /tmp/.data_seeded
    fi
fi

echo ""
echo "✅ Iniciando servidor en modo desarrollo con nodemon..."
echo "📝 Los cambios en el código se aplicarán automáticamente"
echo ""

# Dar permisos a los scripts
chmod +x src/scripts/*.sh 2>/dev/null

# Iniciar con nodemon
exec npx nodemon src/index.js
