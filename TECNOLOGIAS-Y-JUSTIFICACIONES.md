# 🛠️ Tecnologías Utilizadas y Justificaciones

## Descripción del Proyecto

**Sistema de Gestión de Noticias** - Plataforma web completa para publicación, administración y consumo de noticias con sistema de autenticación multi-rol, auditoría de eventos y escalabilidad horizontal.

---

## 📊 Arquitectura General

El proyecto implementa una **arquitectura de microservicios containerizada** con separación clara de responsabilidades:

- **Backend API RESTful**: Node.js + Express
- **Frontend SPA**: HTML/CSS/JavaScript vanilla
- **Capa de Datos**: MongoDB (datos principales)
- **Capa de Caché**: Redis (blacklist JWT y sesiones)
- **Capa de Auditoría**: Apache Cassandra (logs distribuidos)
- **Proxy Reverso**: Nginx
- **Orquestación**: Docker Compose

Esta arquitectura permite **escalabilidad independiente** de cada componente y facilita el **despliegue en la nube** (AWS EC2).

---

## 🔧 Backend - Tecnologías y Justificaciones

### 1. **Node.js 20** - Runtime de JavaScript

**¿Qué hace en el proyecto?**
- Motor de ejecución del servidor backend
- Maneja todas las peticiones HTTP y lógica de negocio
- Gestiona conexiones concurrentes a múltiples bases de datos

**Justificación de uso:**
- ✅ **Event-driven I/O no bloqueante**: Perfecto para aplicaciones con múltiples conexiones simultáneas (MongoDB + Redis + Cassandra)
- ✅ **Ecosistema NPM rico**: Acceso a miles de paquetes especializados (JWT, bcrypt, drivers de BD)
- ✅ **Mismo lenguaje en front y back**: JavaScript en ambos lados reduce la curva de aprendizaje
- ✅ **Performance**: V8 Engine optimizado para operaciones asíncronas intensivas
- ✅ **Escalabilidad horizontal**: Fácil de replicar instancias con PM2 o Kubernetes
- ✅ **JSON nativo**: Ideal para APIs REST que manejan JSON

**Alternativas descartadas:**
- Python (Django/FastAPI): Más lento para I/O concurrente
- Java (Spring Boot): Mayor consumo de memoria y complejidad de setup
- Go: Menor ecosistema de librerías para bases de datos NoSQL

---

### 2. **Express 5.1.0** - Framework Web

**¿Qué hace en el proyecto?**
- Manejo de rutas HTTP (GET, POST, PUT, DELETE, PATCH)
- Middleware para autenticación (JWT), CORS, parsing de JSON
- Sistema de controladores y enrutamiento modular

**Justificación de uso:**
- ✅ **Minimalista y flexible**: No impone estructura rígida, permitiendo arquitectura personalizada
- ✅ **Middleware ecosystem**: Plugins para CORS, compresión, seguridad (helmet)
- ✅ **Performance superior**: Benchmarks muestran ~15,000 req/s en hardware modesto
- ✅ **Documentación extensa**: Comunidad masiva con soluciones a problemas comunes
- ✅ **Fácil integración con websockets**: Para futuras features de tiempo real

**Uso específico en el código:**
```javascript
// Middleware de autenticación global
app.use('/api/news', authMiddleware, newsRoutes);

// CORS para permitir frontend en dominio diferente
app.use(cors({ origin: '*', credentials: true }));
```

**Alternativas descartadas:**
- Fastify: Menor ecosistema de middlewares
- Koa: Requiere más boilerplate para funcionalidades comunes

---

### 3. **MongoDB 6 + Mongoose 8.18.0** - Base de Datos Principal

**¿Qué hace en el proyecto?**
- Almacena usuarios (email, password hash, role)
- Almacena noticias (título, contenido, autor, likes, vistas, categoría)
- Relaciones: Cada noticia tiene referencia al autor (ObjectId)

**Justificación de uso:**

#### **Modelo de datos flexible (Schema-less)**
- ✅ Las noticias pueden tener campos opcionales (summary, imageUrl) sin necesidad de ALTER TABLE
- ✅ Fácil agregar nuevos campos sin migraciones complejas (ej: tags, attachments)

#### **Performance con datos no relacionales**
- ✅ **Lecturas rápidas**: Índices en `{ published: 1, createdAt: -1 }` aceleran listados
- ✅ **Embebido de datos**: `likesCount` y `views` se actualizan en la misma transacción

#### **Escalabilidad horizontal**
- ✅ Sharding nativo para distribuir noticias por categoría o fecha
- ✅ Replica sets para alta disponibilidad

#### **Mongoose ORM**
- ✅ **Validación en esquema**: Asegura integridad sin lógica manual
  ```javascript
  title: {
    type: String,
    required: true,
    maxlength: [200, 'Máximo 200 caracteres']
  }
  ```
- ✅ **Hooks pre-save**: Hash automático de contraseñas
  ```javascript
  UserSchema.pre('save', async function() {
    this.password = await bcrypt.hash(this.password, 10);
  });
  ```
- ✅ **Populate**: Resolver referencias de autor sin joins manuales

**Casos de uso ideales:**
- 📰 Noticias con estructura variable (texto, imágenes, videos)
- 👥 Usuarios con perfiles que evolucionan (agregar bio, avatar, preferencias)
- 💬 Comentarios anidados (futura feature)

**Alternativas descartadas:**
- PostgreSQL: Requiere migraciones para cambios de esquema, menos flexible
- MySQL: Joins complejos para relaciones muchos-a-muchos (likes)

---

### 4. **Redis 7.2-Alpine** - Caché y Blacklist de Tokens

**¿Qué hace en el proyecto?**

#### **1. Blacklist de JWT (Invalidación de sesiones)**
```javascript
// Al hacer logout, se agrega token a blacklist con TTL
await redisClient.setEx(`blacklist:${token}`, ttl, 'invalid');

// En cada request, se verifica:
const isBlacklisted = await redisClient.get(`blacklist:${token}`);
if (isBlacklisted) return res.status(401);
```

#### **2. Caché de perfiles de usuario**
```javascript
// Cachear perfil por 1 hora
await redisClient.setEx(`user:${userId}`, 3600, JSON.stringify(user));
```

**Justificación de uso:**

#### **Performance superior a MongoDB para caché**
- ✅ **Latencia sub-milisegundo**: Redis responde en ~0.2ms vs MongoDB ~10ms
- ✅ **Datos en RAM**: Acceso 100x más rápido que disco

#### **TTL automático (Time To Live)**
- ✅ Blacklist se limpia sola cuando expira el token (72h en este caso)
- ✅ No requiere cronjobs para limpiar tokens expirados

#### **Atomic operations**
- ✅ `INCR` para contadores de vistas (si se migra de MongoDB)
- ✅ `SADD` para sets de usuarios que dieron like (anti-duplicados)

#### **Política de memoria configurada**
```yaml
command: redis-server --maxmemory 100mb --maxmemory-policy volatile-lfu
```
- `volatile-lfu`: Elimina claves menos usadas cuando se llena
- Ideal para cachés donde algunos perfiles se consultan más

**Alternativas descartadas:**
- Memcached: No tiene TTL automático ni estructuras de datos complejas
- MongoDB para blacklist: 100x más lento para lookups simples

---

### 5. **Apache Cassandra (Latest)** - Sistema de Auditoría Distribuido

**¿Qué hace en el proyecto?**
- Registro de **todos los eventos críticos**:
  - `REGISTER`, `LOGIN`, `LOGOUT`
  - `CREATE`, `UPDATE`, `DELETE` de noticias
  - `LIKE`, `UNLIKE`
  - Cambios de roles de usuario
- Cada log incluye: userId, timestamp, action, entity, entityId, details, IP

**Justificación de uso:**

#### **Escrituras ultra-rápidas (Write-optimized)**
- ✅ **10,000-100,000 writes/s** en un solo nodo
- ✅ LSM-tree storage: Escrituras secuenciales en disco (vs random writes de SQL)
- ✅ **No bloquea**: Las escrituras no afectan performance de MongoDB/Redis

#### **Diseñado para time-series data**
```javascript
CREATE TABLE app_logs (
    event_id uuid PRIMARY KEY,
    timestamp timestamp,
    user_id text,
    action text
    // Otros campos...
)
```
- ✅ Particionado automático por timestamp
- ✅ Queries rápidas por rango de fechas: `WHERE timestamp > '2024-01-01'`

#### **Alta disponibilidad (No single point of failure)**
- ✅ Replication factor configurable (RF=3 en producción)
- ✅ Si un nodo cae, los otros siguen escribiendo sin downtime

#### **Escalabilidad lineal**
- ✅ Agregar nodos aumenta capacidad proporcionalmente
- ✅ En AWS: 3 nodos c5.large pueden manejar millones de logs/día

**Uso en el código:**
```javascript
async function logEvent({ userId, action, entity, entityId, ip }) {
  const query = `INSERT INTO app_logs (event_id, user_id, timestamp, action, ...)
                 VALUES (uuid(), ?, toTimestamp(now()), ?, ...)`;
  await client.execute(query, [userId, action, ...], { prepare: true });
}
```

**Casos de uso ideales:**
- 📊 Auditoría de compliance (GDPR, SOX)
- 📈 Analytics de comportamiento de usuarios
- 🔍 Rastreo de acciones para debugging

**Alternativas descartadas:**
- MongoDB para logs: Se degrada con billones de documentos
- Elasticsearch: Más pesado, requiere más recursos (JVM)
- PostgreSQL: Locks en tablas grandes afectan performance

---

### 6. **bcryptjs 2.4.3** - Hash de Contraseñas

**¿Qué hace en el proyecto?**
```javascript
// Pre-save hook en Mongoose
const salt = await bcrypt.genSalt(10);
this.password = await bcrypt.hash(this.password, salt);

// Login: comparar contraseña ingresada vs hash
const isMatch = await bcrypt.compare(inputPassword, user.password);
```

**Justificación de uso:**

#### **Seguridad contra ataques de fuerza bruta**
- ✅ **10 rounds de salt**: ~65ms por hash (lento a propósito)
- ✅ Rainbow tables inútiles: Cada password tiene salt único

#### **Future-proof**
- ✅ Factor de costo ajustable: Aumentar rounds a 12 cuando hardware mejore

#### **Estándar de la industria**
- ✅ Usado por GitHub, Dropbox, LinkedIn

**Alternativas descartadas:**
- MD5/SHA1: Rápidos de crackear con GPUs (billones de hashes/s)
- Argon2: Mejor seguridad, pero menos soporte en Node.js

---

### 7. **jsonwebtoken 9.0.2** - Autenticación Stateless

**¿Qué hace en el proyecto?**
```javascript
// Login: Generar token
const token = jwt.sign(
  { userId: user._id, role: user.role }, 
  JWT_SECRET, 
  { expiresIn: '72h' }
);

// Middleware: Verificar token
const decoded = jwt.verify(token, JWT_SECRET);
req.user = decoded; // { userId, role, iat, exp }
```

**Justificación de uso:**

#### **Autenticación stateless (Sin sesiones en servidor)**
- ✅ No requiere almacenar sesiones en BD (escalabilidad)
- ✅ Múltiples instancias del backend pueden validar sin compartir estado

#### **Información embebida en el token**
- ✅ Role-based access control sin consultar BD en cada request
  ```javascript
  if (req.user.role !== 'admin') return res.status(403);
  ```

#### **Cross-domain authentication**
- ✅ Frontend en `ejemplo.com`, API en `api.ejemplo.com` funciona sin problemas

#### **Expiración automática**
- ✅ Tokens de 72h reducen riesgo de secuestro de sesión

**Seguridad adicional con Redis Blacklist:**
```javascript
// El token sigue siendo válido, pero se invalida manualmente en logout
await redis.setEx(`blacklist:${token}`, ttlRemaining, 'invalid');
```

**Alternativas descartadas:**
- Sesiones con cookies: Requieren sticky sessions en load balancers
- OAuth2: Overkill para app interna sin third-party login

---

### 8. **CORS (cors 2.8.5)** - Cross-Origin Resource Sharing

**¿Qué hace en el proyecto?**
```javascript
app.use(cors({
  origin: '*', // En producción: 'https://misitio.com'
  methods: 'GET,POST,PUT,DELETE,PATCH',
  credentials: true // Permite cookies/auth headers
}));
```

**Justificación de uso:**
- ✅ Frontend servido desde Nginx (puerto 80)
- ✅ Backend API en Express (puerto 3000)
- ✅ Dominios diferentes requieren CORS para requests AJAX

**En producción:**
```javascript
origin: process.env.FRONTEND_URL || 'https://noticias.com'
```

---

### 9. **dotenv 16.0.0** - Variables de Entorno

**¿Qué hace en el proyecto?**
```javascript
// .env
MONGO_USER=julian
MONGO_PASS=secreto123
JWT_SECRET=clave_super_secreta

// Código
const { MONGO_USER, MONGO_PASS } = process.env;
const uri = `mongodb://${MONGO_USER}:${MONGO_PASS}@mongodb:27017`;
```

**Justificación de uso:**
- ✅ **Seguridad**: Credenciales fuera del código fuente (no suben a Git)
- ✅ **Configuración por entorno**: Dev, staging, prod usan diferentes .env
- ✅ **12-Factor App compliance**: Estándar de la industria

---

### 10. **Cassandra Driver 4.8.0** - Cliente de Cassandra

**¿Qué hace en el proyecto?**
```javascript
const client = new Client({
  contactPoints: ['cassandra'],
  localDataCenter: 'datacenter1',
  keyspace: 'news_app_logs'
});

await client.execute(query, params, { prepare: true });
```

**Justificación de uso:**
- ✅ **Prepared statements**: Protege contra CQL injection
- ✅ **Connection pooling**: Reutiliza conexiones TCP
- ✅ **Auto-retry**: Maneja failovers automáticamente

---

### 11. **Nodemon 3.0.1** (DevDependency) - Auto-reload en Desarrollo

**¿Qué hace en el proyecto?**
```json
// nodemon.json
{
  "watch": ["src"],
  "ext": "js,json",
  "exec": "node src/index.js"
}
```

**Justificación de uso:**
- ✅ Reinicia servidor automáticamente al guardar archivos
- ✅ Acelera desarrollo (no reiniciar manualmente)
- ✅ Solo en dev (no afecta producción)

---

## 🎨 Frontend - Tecnologías y Justificaciones

### 1. **HTML5 + CSS3 + JavaScript Vanilla**

**¿Qué hace en el proyecto?**
- `index.html` / `applogin.js`: Página de login/registro
- `news.html` / `news.js`: Página principal de noticias
- Lógica de autenticación, CRUD de noticias, likes, filtros por categoría

**Justificación de NO usar frameworks (React/Vue/Angular):**

#### **Simplicidad y Performance**
- ✅ **Carga instantánea**: No hay bundle de 500KB de React
- ✅ **Cero build step**: No requiere Webpack/Vite/Babel
- ✅ **SEO-friendly**: HTML estático indexable por Google

#### **Aprendizaje de fundamentos**
- ✅ Entender manipulación directa del DOM
- ✅ Manejo manual de estado (vs Redux/Vuex)
- ✅ Fetch API nativa sin axios

#### **Ideal para proyecto de este tamaño**
- ✅ ~1000 líneas de JS (no justifica framework)
- ✅ No hay componentes reutilizables complejos

**Código ejemplo:**
```javascript
// Fetch con manejo de errores
async function fetchNews(category = 'todas') {
  const url = category === 'todas' 
    ? '/api/news' 
    : `/api/news?category=${category}`;
  
  const response = await fetch(url);
  const data = await response.json();
  renderNews(data);
}

// Manipulación DOM directa
function renderNews(newsArray) {
  newsGrid.innerHTML = newsArray.map(item => `
    <div class="news-card">
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
    </div>
  `).join('');
}
```

**Cuando SÍ usar frameworks:**
- Aplicación con >10,000 líneas de código
- Componentes altamente reutilizables (ej: dashboard administrativo)
- Necesidad de routing complejo (SPA multi-página)

---

### 2. **Tailwind CSS (CDN)**

**¿Qué hace en el proyecto?**
```html
<div class="bg-white shadow-md rounded-lg p-6 hover:shadow-xl transition">
  <h2 class="text-2xl font-bold text-gray-800 mb-4">Título</h2>
</div>
```

**Justificación de uso:**

#### **Utility-first CSS**
- ✅ No requiere escribir CSS custom
- ✅ Consistencia visual automática (espaciados, colores)

#### **Desarrollo rápido**
- ✅ Prototipar layouts en minutos
- ✅ No pensar nombres de clases (`header-title` vs `.text-2xl.font-bold`)

#### **Responsive design built-in**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- Auto-responsive grid -->
</div>
```

#### **CDN vs Build**
- ✅ Sin npm install ni build step
- ⚠️ Downside: Archivo completo de Tailwind (~3MB sin purge)
- ✅ Para producción: Usar PostCSS con purge (solo clases usadas)

**Alternativas descartadas:**
- Bootstrap: Más pesado, estilos pre-definidos (menos customizable)
- CSS puro: Requiere escribir media queries manuales

---

### 3. **LocalStorage** - Persistencia de Token JWT

**¿Qué hace en el proyecto?**
```javascript
// Guardar token al login
localStorage.setItem('jwtToken', token);
localStorage.setItem('userRole', role);

// Leer token en cada request
const token = localStorage.getItem('jwtToken');
fetch('/api/news', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// Limpiar al logout
localStorage.clear();
```

**Justificación de uso:**
- ✅ **Persiste entre sesiones**: Usuario no re-logea al cerrar pestaña
- ✅ **Accesible desde JavaScript**: Enviar en headers de fetch
- ✅ **5MB de capacidad**: Suficiente para token + metadata

**Riesgos de seguridad mitigados:**
- ⚠️ Vulnerable a XSS (Cross-Site Scripting)
- ✅ **Mitigación 1**: Sanitizar inputs en backend
- ✅ **Mitigación 2**: Content Security Policy (CSP) headers
- ✅ **Mitigación 3**: HTTPOnly cookies (futura mejora)

**Alternativas:**
- Cookies HTTPOnly: Más seguras, pero requieren configuración CORS avanzada
- SessionStorage: Se borra al cerrar pestaña (mala UX)

---

## 🌐 Nginx - Proxy Reverso y Servidor de Estáticos

### **Nginx Alpine**

**¿Qué hace en el proyecto?**

#### **1. Servidor de archivos estáticos**
```nginx
location ~* \.(html|css|js|png|jpg)$ {
  try_files $uri =404;
  expires 1h;
  add_header Cache-Control "public, immutable";
}
```
- Sirve `index.html`, `news.html`, archivos CSS/JS

#### **2. Proxy reverso hacia backend**
```nginx
location /api/ {
  proxy_pass http://backend:3000;
  proxy_set_header X-Real-IP $remote_addr;
}
```
- Todas las requests a `/api/*` se reenvían al backend
- Permite CORS sin configuración compleja

#### **3. SPA routing**
```nginx
location / {
  try_files $uri $uri/ /news.html;
}
```

**Justificación de uso:**

#### **Performance superior vs servir desde Node.js**
- ✅ Nginx sirve archivos estáticos 10x más rápido que Express
- ✅ Manejo eficiente de conexiones concurrentes (event-driven)

#### **Separación de responsabilidades**
- ✅ Nginx: Archivos estáticos + SSL termination
- ✅ Express: Solo lógica de negocio y API

#### **Load balancing fácil**
```nginx
upstream backend {
  server backend1:3000;
  server backend2:3000;
  server backend3:3000;
}
```

#### **Configuración de SSL (Producción)**
```nginx
listen 443 ssl;
ssl_certificate /etc/letsencrypt/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/privkey.pem;
```

**Imagen Alpine:**
- ✅ Solo 23MB vs 133MB de nginx:latest
- ✅ Menor superficie de ataque (menos paquetes instalados)

**Alternativas descartadas:**
- Apache: Más pesado, configuración más compleja
- Servir todo desde Express: Mezcla responsabilidades, peor performance

---

## 🐳 Docker y Orquestación

### 1. **Docker** - Containerización

**¿Qué hace en el proyecto?**
- Cada servicio corre en contenedor aislado:
  - `my-backend-container`: Node.js app
  - `my-frontend-container`: Nginx
  - `my-mongodb-container`: MongoDB
  - `my-redis-container`: Redis
  - `my-cassandra-container`: Cassandra

**Justificación de uso:**

#### **Entornos consistentes (Dev = Prod)**
- ✅ "Funciona en mi máquina" → Funciona en todas
- ✅ Mismas versiones de MongoDB, Redis, etc.

#### **Aislamiento de dependencias**
- ✅ Cada servicio tiene su filesystem y red aislados
- ✅ No conflictos de puertos (remap interno)

#### **Despliegue simplificado**
```bash
# Levantar todo el stack
docker compose up -d

# En producción (AWS EC2)
git pull
docker compose up -d --build
```

#### **Rollback rápido**
```bash
docker compose down
git checkout v1.0.0
docker compose up -d
```

**Dockerfiles optimizados:**
```dockerfile
# Backend - Multi-stage build (futuro)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
COPY --from=builder /app/node_modules ./node_modules
```

---

### 2. **Docker Compose** - Orquestación Multi-Container

**¿Qué hace en el proyecto?**

#### **Definición de servicios y dependencias**
```yaml
services:
  backend:
    depends_on:
      - mongodb
      - redis
      - cassandra
    environment:
      - MONGO_HOST=mongodb  # Service discovery
```

#### **Redes internas**
```yaml
networks:
  my-backend-net:
    driver: bridge
```
- Backend, MongoDB, Redis, Cassandra en misma red privada
- Frontend solo expone puerto 80 al exterior

#### **Volúmenes persistentes**
```yaml
volumes:
  mongodb:  # Datos sobreviven a docker compose down
  cassandra-data:
```

#### **Health checks**
```yaml
healthcheck:
  test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
  interval: 10s
  retries: 5
```

**Justificación de uso:**
- ✅ **Startup automático**: Cassandra inicia antes que backend
- ✅ **Configuración centralizada**: Un archivo vs 5 docker run
- ✅ **Environment parity**: Mismo compose en dev/staging/prod

**docker-compose.dev.yml (Override):**
```yaml
services:
  backend:
    volumes:
      - ./back:/usr/src/app  # Hot-reload
    command: npm run dev  # Nodemon
```

**Alternativas:**
- Kubernetes: Overkill para este proyecto (alta curva de aprendizaje)
- Docker Swarm: Menos adopción que K8s, mismo nivel de complejidad

---

## ☁️ Despliegue en Cloud

### **AWS EC2 (Elastic Compute Cloud)**

**¿Qué hace en el proyecto?**
- Servidor virtual Linux (Ubuntu 22.04)
- Ejecuta Docker Compose con todos los servicios
- IP pública para acceso desde internet

**Justificación de uso:**

#### **Tier gratuito (12 meses)**
- ✅ t2.micro: 750 horas/mes gratis
- ✅ 1 vCPU, 1GB RAM (suficiente con swap)
- ✅ 30GB EBS storage

#### **Control total del servidor**
- ✅ SSH root access
- ✅ Instalar cualquier software (Docker, Nginx)
- ✅ Configurar firewall (Security Groups)

#### **Escalabilidad vertical**
```bash
# Cuando crece el tráfico
# t2.micro → t2.small → t2.medium
```

#### **Configuración de seguridad**
```yaml
Security Group Rules:
  - SSH (22): Solo desde mi IP
  - HTTP (80): 0.0.0.0/0 (público)
  - HTTPS (443): 0.0.0.0/0
  - Backend (3000): CERRADO (solo via Nginx)
```

**Optimizaciones para 1GB RAM:**
```bash
# Swap de 2GB
sudo fallocate -l 2G /swapfile
sudo swapon /swapfile

# Limitar memoria de MongoDB
mongod --wiredTigerCacheSizeGB 0.25
```

**Alternativas descartadas:**
- Heroku: No tier gratuito desde 2022
- DigitalOcean: $6/mes (vs AWS gratis por 1 año)
- Vercel/Netlify: No soportan MongoDB/Redis (solo serverless)

**Servicios AWS complementarios (futuro):**
- **RDS**: MongoDB managed (eliminar mantenimiento)
- **ElastiCache**: Redis managed
- **S3**: Almacenar imágenes de noticias
- **CloudFront**: CDN para servir estáticos globalmente
- **Route 53**: DNS con dominio custom

---

## 🔐 Seguridad - Stack de Tecnologías

### 1. **bcrypt (Hash de contraseñas)**
- ✅ Salt automático único por usuario
- ✅ 10 rounds = ~65ms (protección brute-force)

### 2. **JWT con expiración**
- ✅ Tokens de 72 horas (balance seguridad/UX)
- ✅ Payload mínimo (solo userId + role)

### 3. **Redis Blacklist**
- ✅ Invalidación manual de tokens
- ✅ TTL automático (limpieza sin cronjobs)

### 4. **Mongoose Schema Validation**
```javascript
email: {
  match: [/.+@.+\..+/, 'Email inválido']
}
```

### 5. **CORS configurado**
- ✅ En producción: Solo dominio específico
- ✅ Credentials: true (permite auth headers)

### 6. **Environment variables**
- ✅ Credenciales fuera del código
- ✅ .env en .gitignore

**Mejoras futuras:**
- Helmet.js (security headers)
- Rate limiting (express-rate-limit)
- HTTPS con Let's Encrypt
- SQL/NoSQL injection protection

---

## 📦 Gestión de Dependencias

### **NPM (Node Package Manager)**

**¿Por qué NPM y no Yarn/PNPM?**

#### **Instalación por defecto con Node.js**
- ✅ No requiere instalación adicional
- ✅ Menor fricción para nuevos desarrolladores

#### **Lock files**
```json
// package-lock.json
{
  "lockfileVersion": 3,
  "dependencies": {
    "express": {
      "version": "5.1.0",
      "integrity": "sha512-..."
    }
  }
}
```
- ✅ Reproducibilidad de instalaciones
- ✅ Security audits automáticos

#### **Scripts de automatización**
```json
{
  "scripts": {
    "start": "bash src/scripts/startup.sh",
    "dev": "bash src/scripts/startup-dev.sh",
    "seed": "node src/scripts/seed-data.js"
  }
}
```

---

## 🎯 Patrones de Arquitectura Implementados

### 1. **MVC (Model-View-Controller)**
```
models/          → Esquemas de MongoDB
controllers/     → Lógica de negocio
routes/          → Definición de endpoints
middlewares/     → Autenticación y autorización
```

### 2. **Repository Pattern (Mongoose)**
```javascript
// User.findById() abstrae queries SQL/NoSQL
const user = await User.findById(userId);
```

### 3. **Middleware Chain (Express)**
```javascript
app.use('/api/admin', authMiddleware, checkRoleAdmin, adminRoutes);
```

### 4. **Dependency Injection (Configuración centralizada)**
```javascript
// redis.config.js exporta cliente configurado
import redisClient from './config/redis.config.js';
```

---

## 📊 Comparación de Tecnologías

| Aspecto | Tecnología Elegida | Alternativa | Justificación |
|---------|-------------------|-------------|---------------|
| **Runtime** | Node.js | Python (FastAPI) | I/O no bloqueante ideal para múltiples BDs |
| **Framework** | Express | Fastify | Ecosistema más maduro |
| **BD Principal** | MongoDB | PostgreSQL | Esquema flexible para noticias |
| **Caché** | Redis | Memcached | TTL automático y estructuras complejas |
| **Logs** | Cassandra | Elasticsearch | Menor consumo de recursos |
| **Auth** | JWT + Redis | Sessions | Stateless, escalable horizontalmente |
| **Frontend** | Vanilla JS | React | Simplicidad para proyecto pequeño |
| **Styles** | Tailwind CDN | Bootstrap | Utility-first, más customizable |
| **Proxy** | Nginx | Apache | Mejor performance para estáticos |
| **Orquestación** | Docker Compose | Kubernetes | Curva de aprendizaje menor |
| **Cloud** | AWS EC2 | Heroku | Tier gratuito disponible |

---

## 🚀 Escalabilidad y Consideraciones de Producción

### **Horizontal Scaling (Múltiples instancias)**
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
    
  nginx:
    # Load balancer
    upstream backend {
      server backend1:3000;
      server backend2:3000;
      server backend3:3000;
    }
```

### **Database Sharding**
```javascript
// MongoDB: Sharding por categoría
sh.shardCollection("periodico.news", { category: 1 })
```

### **Redis Cluster**
```yaml
redis:
  image: redis:7.2-cluster
  deploy:
    replicas: 6  # 3 masters + 3 replicas
```

### **Cassandra Multi-Datacenter**
```yaml
cassandra:
  environment:
    - CASSANDRA_DC=us-east
  deploy:
    replicas: 3
```

---

## 📈 Métricas y Monitoreo (Futuro)

### **Prometheus + Grafana**
```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

### **Winston Logger (Reemplazar console.log)**
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});
```

---

## 🎓 Conclusión

Este proyecto demuestra una **arquitectura moderna y escalable** con:

1. **Separación de responsabilidades**: Cada tecnología resuelve un problema específico
2. **Escalabilidad**: Diseño preparado para crecer (sharding, replicación, load balancing)
3. **Seguridad**: Múltiples capas (bcrypt, JWT, blacklist, CORS)
4. **Observabilidad**: Cassandra para auditoría completa
5. **DevOps**: Containerización y CI/CD simplificado
6. **Performance**: Caché en Redis, índices en MongoDB, Nginx para estáticos

**Tecnologías clave:**
- Node.js + Express: API robusta y escalable
- MongoDB: Flexibilidad para datos semi-estructurados
- Redis: Performance sub-milisegundo para caché
- Cassandra: Auditoría distribuida de alto rendimiento
- Docker: Portabilidad y consistencia entre entornos
- Nginx: Proxy reverso eficiente
- AWS EC2: Despliegue cloud accesible

Este stack es ideal para **aplicaciones de medios, publicación de contenido y SaaS** con requisitos de auditoría y escalabilidad.
