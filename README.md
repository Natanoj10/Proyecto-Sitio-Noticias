# 📰 Sistema de Gestión de Periódico Digital

## 🧾 Descripción

Este proyecto es un prototipo de sistema para un "periódico" (o aplicación de gestión de usuarios / noticias), con énfasis en la autenticación de usuarios, control de roles (user / editor / admin), y un mecanismo de logging / auditoría usando bases de datos múltiples. Está diseñado como un proyecto escolar de equipo, con backend, frontend y bases de datos integradas.

### Arquitectura de Bases de Datos

La arquitectura usa tres bases de datos especializadas:

- **MongoDB**: Base principal donde se almacenarán los datos de usuarios y —en el futuro— las "noticias" u otro contenido persistente.
- **Redis**: Caché de sesión / autenticación / blacklist de tokens.
- **Apache Cassandra**: Almacenamiento de logs / auditoría, para registrar eventos como login, logout, registro, cambios, etc.

La aplicación incluye un backend en Express.js + Node.js, y un frontend estático (HTML + JS + CSS), orquestados vía contenedores Docker + Docker Compose, para facilitar despliegue y desarrollo local.

**El resultado**: una solución full-stack modular, con separación de responsabilidades, persistencia de datos, caching, logging, y autenticación basada en JWT.

## 🚧 Estado del Proyecto

- **Estado actual**: Funcional — autenticación + roles + caching + logging ya implementados.
- **Pendiente / futuros pasos**: Implementar módulo de "noticias" en Mongo (CRUD de artículos), frontend completo para noticias, API REST para noticias, pruebas de carga, documentación de diseño, etc.

## ✅ Características Principales

- Registro de usuarios con email + contraseña (hasheada)
- Inicio de sesión / logout con tokens JWT
- Gestión de roles (user, editor, admin)
- Caché de perfil + blacklist de tokens usando Redis — evita repetir consulta a DB y permite invalidar sesiones
- Logging de eventos sensibles (registro, login, logout, cambios) en Cassandra — permite auditoría y trazabilidad
- Arquitectura modular: backend, frontend y servicios separados vía Docker
- Preparado para expandir: puedes añadir CRUD de noticias, roles, permisos, etc.

## 🗂 Estructura del Proyecto
```
Proyecto-Sitio-Noticias/
├── back/                # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/      # Configuración de bases de datos (Mongo, Redis, Cassandra)
│   │   ├── logger/      # Módulo de logging con Cassandra
│   │   ├── controllers/ # Controladores (auth, admin...)
│   │   ├── middlewares/ # Middlewares de autenticación / roles
│   │   ├── models/      # Modelos mongoose
│   │   ├── routes/      # Rutas API
│   │   └── index.js     # Punto de entrada del servidor
│   ├── package.json
│   └── Dockerfile
├── front/               # Frontend estático (login, panel, etc)
│   ├── index.html
│   ├── applogin.js
│   ├── applogin.css
│   └── Dockerfile
├── docker-compose.yml   # Orquestación de servicios (Mongo, Redis, Cassandra, Backend, Frontend)
├── .env                 # Variables de entorno (configuración de bases, puertos, credenciales)
└── README.md            # Este archivo
```

## 🛠 Tecnologías Utilizadas

- **Node.js + Express.js** — Servidor backend
- **MongoDB** — Base de datos principal (persistencia de usuarios, futuro contenido)
- **Redis** — Cache + blacklist de tokens (sesión / autenticación)
- **Apache Cassandra** — Base de datos NoSQL para logging / auditoría de eventos
- **JWT (JSON Web Tokens)** — Para autenticación y manejo de sesiones
- **Docker + Docker Compose** — Para orquestar servicios y facilitar despliegue / desarrollo
- **HTML / CSS / JS** — Frontend minimalista (login, panel de usuarios)

## 🚀 Instalación y Despliegue (Local / Desarrollo)

1. Clonar el repositorio (o descargar + descomprimir).

2. Crear un archivo `.env` en la raíz con variables necesarias (usuario Mongo, contraseña, host/puertos, claves, etc).

3. Ejecutar Docker Compose desde la raíz:
```bash
   docker compose up -d
```
   Esto levantará los servicios: Mongo, Redis, Cassandra, Backend y Frontend.

4. **(Opcional)** Entrar a Cassandra para crear el keyspace/tabla de logs — sólo si no lo creaste aún:
```bash
   docker exec -it my-cassandra-container cqlsh
```
   Luego ejecutar los comandos CQL para crear `news_app_logs.app_logs`.

5. Acceder al frontend — por ejemplo en `http://localhost:8080` (según tu configuración).

6. Probar registro, login, logout — verificar también que los logs se guarden en Cassandra.

## 🔧 Configuración (Variables de Entorno)

Dentro de `.env`, por ejemplo:
```env
MONGO_USER=...
MONGO_PASS=...
MONGO_HOST=...
MONGO_PORT=...
MONGO_DB=...

REDIS_HOST=...
REDIS_PORT=...

CASSANDRA_HOST=cassandra      # nombre del servicio en docker-compose
CASSANDRA_DC=datacenter1      # datacenter para Cassandra

BACKEND_PORT=3000
JWT_SECRET=tu_secreto_jwt
```

Asegúrate de ajustar los valores según tu entorno.

## 🔍 Logging / Auditoría con Cassandra

El proyecto incluye un módulo de logging que registra en Cassandra eventos importantes: registro de usuario, login, logout, cambios, etc. 

Cada evento almacena:
- `event_id` (UUID)
- `user_id`
- `timestamp`
- `action`
- `entity`
- `entity_id`
- `details`
- `ip_address`

Esto permite llevar un historial de auditoría — útil para seguridad, control, depuración, estadísticas, etc.

---

**Nota**: Este es un proyecto educativo desarrollado en equipo. Contribuciones y mejoras son bienvenidas.
