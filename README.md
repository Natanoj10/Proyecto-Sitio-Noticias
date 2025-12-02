# 📰 Sistema de Gestión de Noticias

Sistema web completo para publicación y gestión de noticias con autenticación de usuarios, roles y seguimiento de eventos mediante auditoría en Cassandra.

## 🏗️ Arquitectura

- **Backend**: Node.js + Express
- **Frontend**: HTML/CSS/JS + Tailwind CSS + Nginx
- **Base de Datos**: MongoDB (usuarios y noticias)
- **Caché**: Redis (blacklist de tokens JWT y caché de sesiones)
- **Logs**: Apache Cassandra (auditoría de eventos)
- **Orquestación**: Docker Compose

## 🎯 Funcionalidades

### Roles de Usuario
- **User**: Ver noticias, dar/quitar likes
- **Editor**: Crear y editar sus propias noticias, ver estadísticas
- **Admin**: Gestión completa de usuarios y todas las noticias, cambiar roles, eliminar usuarios

### Características Principales
- Autenticación JWT con blacklist en Redis
- CRUD completo de noticias con control de permisos por rol
- Sistema de likes y contador de vistas en tiempo real
- Filtrado por categorías (política, deportes, tecnología, cultura, economía, internacional)
- Gestión de usuarios (cambio de roles, eliminación)
- Registro de auditoría completo en Cassandra (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, LIKE)
- Sistema de borradores (noticias publicadas/no publicadas)
- Proxy reverso con Nginx para el frontend

## 📋 Requisitos Previos

- Docker y Docker Compose instalados
- Puertos disponibles: `3000`, `8080`, `27017`, `6379`, `9042`

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd Proyecto-Sitio-Noticias
```

### 2. Configurar variables de entorno
El proyecto incluye un archivo `.env`. Puedes modificarlo si lo necesitas:

```env
MONGO_USER=julian
MONGO_PASS=pepe123
MONGO_HOST=mongodb
MONGO_PORT=27017
MONGO_DB=periodico
REDIS_PORT=6379
BACKEND_PORT=3000
REDIS_HOST=redisdb
CLAVE=clave_secreta_007
```

**Nota importante**: El proyecto **NO** incluye `JWT_SECRET` en `.env`. El backend usa un fallback: `'mi_secreto_seguro'`. Para producción, **debes agregar** `JWT_SECRET` al archivo `.env`.

### 3. Levantar los servicios con Docker
```bash
docker compose up --build
```

El sistema:
1. Levanta MongoDB, Redis y Cassandra
2. Inicializa el keyspace y tabla de Cassandra automáticamente
3. Ejecuta el **seed automático** con datos de prueba (usuarios y noticias)
4. Inicia el backend en modo producción
5. Despliega el frontend con Nginx

Esto iniciará:
- **MongoDB** en puerto 27017
- **Redis** en puerto 6379
- **Cassandra** en puerto 9042
- **Backend** en puerto 3000
- **Frontend (Nginx)** en puerto 8080

### 4. Acceder a la aplicación

- **Frontend**: http://localhost:8080
- **API Backend**: http://localhost:3000/api

### 5. Credenciales de acceso

El seed automático crea los siguientes usuarios:

| Email | Password | Rol |
|-------|----------|-----|
| `admin@periodico.com` | `admin123` | Admin |
| `editor1@periodico.com` | `editor123` | Editor |
| `editor2@periodico.com` | `editor123` | Editor |
| `usuario1@correo.com` | `user123` | User |
| `usuario2@correo.com` | `user123` | User |

También crea **10 noticias** de ejemplo en diferentes categorías con likes y vistas aleatorias

## 📡 Endpoints Principales

### Autenticación (`/api/auth`)
- `POST /register` - Registrar nuevo usuario (rol: user por defecto)
- `POST /login` - Iniciar sesión (retorna JWT)
- `POST /logout` - Cerrar sesión (invalida token en Redis blacklist)

### Noticias (`/api/news`)
- `GET /` - Listar noticias publicadas (público, soporta filtros: `?category=tecnología&limit=20&skip=0`)
- `GET /:id` - Ver noticia específica (público, incrementa contador de vistas)
- `POST /` - Crear noticia (editor/admin)
- `PUT /:id` - Actualizar noticia (editor propietario o admin)
- `DELETE /:id` - Eliminar noticia (solo admin)
- `POST /:id/like` - Dar/quitar like (usuario autenticado)
- `GET /my/articles` - Obtener mis noticias (editor/admin)
- `GET /all/manage` - Obtener todas las noticias para gestión (solo admin)

### Usuarios (`/api/user` y `/api/admin`)
- `GET /api/user/profile` - Ver mi perfil (autenticado)
- `GET /api/admin/users` - Listar todos los usuarios (solo admin)
- `PATCH /api/admin/users/:id/role` - Cambiar rol de usuario (solo admin)
- `DELETE /api/admin/users/:id` - Eliminar usuario (solo admin)

### Setup (Solo primera vez)
- `POST /api/setup/first-admin` - Crear primer administrador (requiere `secretKey`)

## 🗂️ Categorías de Noticias

- Política
- Deportes
- Tecnología
- Cultura
- Economía
- Internacional
- Otros

## 🛠️ Comandos de Desarrollo

### Modo Desarrollo (con hot-reload)
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```
Usa `nodemon` para reiniciar automáticamente el backend al detectar cambios.

### Modo Producción
```bash
docker compose up --build
```

### Detener los servicios
```bash
docker compose down
```

### Detener y eliminar volúmenes (reset completo)
```bash
docker compose down -v
```

### Ver logs del sistema
```bash
docker compose logs -f
```

### Ver logs de un servicio específico
```bash
docker compose logs -f backend
docker compose logs -f cassandra
```

### Ejecutar seed manualmente (desde el contenedor)
```bash
docker exec -it my-backend-container npm run seed
```

### Acceder a MongoDB
```bash
docker exec -it my-mongodb-container mongosh -u julian -p pepe123 --authenticationDatabase admin
```

### Acceder a Cassandra CQL
```bash
docker exec -it my-cassandra-container cqlsh
# Luego: USE news_app_logs;
# SELECT * FROM app_logs LIMIT 10;
```

### Acceder a Redis CLI
```bash
docker exec -it my-redis-container redis-cli
```

## 📁 Estructura del Proyecto

```
├── back/                           # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── controllers/            # Lógica de negocio
│   │   │   ├── news.controller.js        # CRUD de noticias
│   │   │   └── userauth.controller.js    # Register, Login, Logout
│   │   ├── models/                 # Modelos Mongoose
│   │   │   ├── news.model.js             # Schema de noticias
│   │   │   └── userauth.model.js         # Schema de usuarios (con bcrypt hook)
│   │   ├── routes/                 # Definición de rutas
│   │   │   ├── admin.routes.js           # Gestión de usuarios
│   │   │   ├── auth.routes.js            # Autenticación
│   │   │   ├── news.routes.js            # Noticias
│   │   │   ├── setup.routes.js           # Crear primer admin
│   │   │   └── userauth.routes.js        # Perfil de usuario
│   │   ├── middlewares/            # Middlewares de autenticación/autorización
│   │   │   ├── checkRole.middleware.js   # Verificar roles
│   │   │   └── userauth.middleware.js    # Verificar JWT y blacklist
│   │   ├── config/                 # Configuración de bases de datos
│   │   │   ├── db.config.js              # MongoDB connection
│   │   │   └── redis.config.js           # Redis client
│   │   ├── logger/                 # Sistema de auditoría
│   │   │   └── logger.cassandra.js       # Logger de eventos en Cassandra
│   │   ├── scripts/                # Scripts de inicialización
│   │   │   ├── init-cassandra.sh         # Crear keyspace y tabla
│   │   │   ├── seed-data.js              # Datos de prueba
│   │   │   ├── startup.sh                # Script de inicio (producción)
│   │   │   └── startup-dev.sh            # Script de inicio (desarrollo)
│   │   └── index.js                # Punto de entrada del servidor
│   ├── dockerfile                  # Imagen Docker (producción)
│   ├── dockerfile.dev              # Imagen Docker (desarrollo con nodemon)
│   ├── nodemon.json                # Configuración de nodemon
│   └── package.json                # Dependencias del backend
├── front/                          # Frontend estático (HTML/CSS/JS)
│   ├── index.html                  # Página de login/perfil de usuario
│   ├── applogin.css                # Estilos del login
│   ├── applogin.js                 # Lógica de autenticación
│   ├── news.html                   # Página principal de noticias
│   ├── news.css                    # Estilos de noticias
│   ├── news.js                     # Lógica de noticias (CRUD, likes, filtros)
│   ├── nginx.config                # Configuración de Nginx (proxy /api/)
│   └── dockerfile                  # Imagen Docker con Nginx
├── docker-compose.yml              # Orquestación completa (producción)
├── docker-compose.dev.yml          # Override para desarrollo
├── .env                            # Variables de entorno
└── package.json                    # Dependencias raíz (bcrypt, jwt)
```

## 🔒 Seguridad

- **Contraseñas**: Hasheadas con `bcrypt` (10 rounds de salt) usando pre-save hook en Mongoose
- **Autenticación**: JWT con expiración de 72 horas
- **Blacklist de tokens**: Redis invalida tokens al hacer logout (TTL basado en expiración del token)
- **Middleware de roles**: Verificación de permisos por ruta (`checkRole`)
- **Ruta de admin protegida**: `/api/setup/first-admin` requiere `secretKey` y solo funciona si no hay admins
- **CORS**: Configurado en el backend (origin: `*` en desarrollo)
- **Proxy reverso**: Nginx maneja las peticiones estáticas y proxy hacia el backend

## 📝 Notas Técnicas

### Sistema de Seed Automático
- El script `startup.sh` verifica si existen usuarios en MongoDB
- Si **no** hay datos, ejecuta automáticamente `seed-data.js`
- Crea 5 usuarios (1 admin, 2 editores, 2 users)
- Crea 10 noticias de ejemplo con likes y vistas aleatorias
- El seed **solo se ejecuta una vez** en el primer arranque

### Arquitectura de Logs
- Cassandra registra **todos** los eventos críticos:
  - `REGISTER`, `LOGIN`, `LOGOUT`
  - `CREATE`, `UPDATE`, `DELETE` (noticias y usuarios)
  - `LIKE`, `UNLIKE`
- Cada log incluye: `userId`, `timestamp`, `action`, `entity`, `entityId`, `details`, `ip_address`
- Keyspace: `news_app_logs`, Tabla: `app_logs`

### Redis
- **Blacklist de tokens**: Clave `blacklist:${token}` con TTL igual al tiempo restante del token
- **Caché de perfil**: Clave `user:${userId}` con TTL de 3600s (1 hora)
- **Política de memoria**: `volatile-lfu` con límite de 100mb

### Flujo de Autenticación
1. Usuario se registra/loguea → Backend genera JWT
2. Frontend almacena token en `localStorage`
3. Cada request protegido envía: `Authorization: Bearer ${token}`
4. Middleware verifica:
   - Que el token exista
   - Que **no** esté en blacklist de Redis
   - Que sea válido y no expirado
5. Al hacer logout, token se agrega a blacklist en Redis

### Gestión de Noticias
- Solo las noticias con `published: true` son visibles públicamente
- Los editores solo pueden editar sus propias noticias
- Los admins pueden editar/eliminar cualquier noticia
- El contador de vistas se incrementa en cada `GET /:id`
- El sistema de likes previene duplicados (array de `userIds`)

## ⚙️ Variables de Entorno Faltantes (Recomendado para Producción)

Agrega estas variables a tu `.env`:

```env
# JWT Secret (MUY IMPORTANTE)
JWT_SECRET=tu_secreto_super_seguro_aqui_cambialo

# Cassandra (opcional, valores por defecto)
CASSANDRA_HOST=cassandra
CASSANDRA_DC=datacenter1

# Node Environment
NODE_ENV=production
```

## 🧹 Limpieza y Troubleshooting

### Eliminar completamente todos los datos y contenedores
```bash
docker compose down -v
docker system prune -a
```

### Re-ejecutar el seed (si borraste los datos)
```bash
docker compose down -v
docker compose up --build
```
El seed se ejecutará automáticamente al detectar que no hay usuarios.

### Problemas comunes

**Error: "MongoDB no conecta"**
```bash
# Verificar estado de MongoDB
docker logs my-mongodb-container

# Verificar que el healthcheck pase
docker ps
```

**Error: "Cassandra no inicializa"**
```bash
# Verificar logs de inicialización
docker logs cassandra-init

# Conectar manualmente y verificar
docker exec -it my-cassandra-container cqlsh
DESC KEYSPACES;
USE news_app_logs;
DESC TABLES;
```

**Error: "Redis no responde"**
```bash
# Verificar estado
docker exec -it my-redis-container redis-cli ping
# Debe retornar: PONG

# Ver memoria usada
docker exec -it my-redis-container redis-cli INFO memory
```

**Frontend no carga o muestra error 502**
```bash
# Verificar que el backend esté corriendo
curl http://localhost:3000/api/news

# Ver logs del backend
docker logs my-backend-container -f
```

**Los tokens no se invalidan al hacer logout**
- Verifica que Redis esté funcionando correctamente
- Comprueba la conexión a Redis en los logs del backend

## 🚀 Flujo de Trabajo Completo

1. **Arranque inicial**:
   ```bash
   docker compose up --build
   ```
   - Se crean las bases de datos
   - Se ejecuta el seed automático
   - El sistema queda listo para usar

2. **Acceder al frontend**: http://localhost:8080

3. **Login como admin**: 
   - Email: `admin@periodico.com`
   - Password: `admin123`

4. **Explorar funcionalidades**:
   - Ver noticias públicas
   - Crear nuevas noticias (como editor/admin)
   - Dar likes (como usuario autenticado)
   - Gestionar usuarios (como admin)
   - Ver logs de auditoría en Cassandra

5. **Desarrollo con hot-reload**:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up
   ```

## 📊 Tecnologías y Dependencias

### Backend
- `express` ^5.1.0 - Framework web
- `mongoose` ^8.18.0 - ODM para MongoDB
- `redis` ^5.8.3 - Cliente de Redis
- `cassandra-driver` ^4.8.0 - Cliente de Cassandra
- `jsonwebtoken` ^9.0.2 - Generación y verificación de JWT
- `bcryptjs` ^2.4.3 - Hash de contraseñas
- `cors` ^2.8.5 - Control de CORS
- `dotenv` ^16.0.0 - Variables de entorno
- `nodemon` ^3.0.1 (dev) - Auto-restart en desarrollo

### Frontend
- Tailwind CSS (CDN)
- JavaScript vanilla
- Nginx Alpine

### Infraestructura
- MongoDB 6
- Redis 7.2-Alpine
- Cassandra Latest
- Node.js 20
- Docker & Docker Compose

---

**Nota**: Este es un proyecto educativo. Para producción, considera agregar:
- HTTPS con certificados SSL
- Rate limiting
- Validación de inputs más robusta
- Tests automatizados
- CI/CD pipeline
- Monitoreo y alertas
- Backups automáticos de bases de datos
