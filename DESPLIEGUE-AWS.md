# 🚀 Guía Completa de Despliegue en AWS (Tier Gratuito)

---

## 1. Crear Cuenta de AWS

### 1.1 Registro en AWS

1. **Ir a AWS**:
   - Visita: https://aws.amazon.com/
   - Clic en "Crear una cuenta de AWS" (esquina superior derecha)

2. **Completar el formulario**:
   ```
   Dirección de email: tu-email@ejemplo.com
   Nombre de cuenta AWS: Mi-Proyecto-Noticias
   ```

3. **Información de contacto**:
   - Selecciona "Personal" (para uso personal)
   - Completa tu nombre, dirección, teléfono
   
4. **Información de pago**:
   - ⚠️ **IMPORTANTE**: AWS requiere tarjeta de crédito/débito
   - NO te cobrarán si te mantienes en el tier gratuito
   - Validarán con un cargo temporal de $1 USD (se reembolsa)

5. **Verificación de identidad**:
   - Ingresa tu número de teléfono
   - Recibirás un código por SMS o llamada
   - Ingresa el código de 4 dígitos

6. **Seleccionar plan de soporte**:
   - Elige **"Plan de soporte básico (gratuito)"**

7. **Confirmación**:
   - Recibirás un email de confirmación
   - Puede tomar hasta 24 horas activar tu cuenta
   - Normalmente es instantáneo

### 1.2 Iniciar Sesión en la Consola

1. **Ir a la consola**: https://console.aws.amazon.com/
2. **Seleccionar**: "Cuenta raíz"
3. **Ingresar**:
   - Email de tu cuenta
   - Contraseña

---

## 2. Configurar Seguridad Inicial

### 2.1 Habilitar MFA (Autenticación de Doble Factor)

1. **En la consola de AWS**:
   - Clic en tu nombre (arriba a la derecha)
   - Selecciona "Security credentials"

2. **Activar MFA**:
   - Sección "Multi-factor authentication (MFA)"
   - Clic en "Assign MFA device"
   - Selecciona "Virtual MFA device"

3. **Configurar app de autenticación**:
   - Descarga Google Authenticator o Authy en tu celular
   - Escanea el código QR
   - Ingresa dos códigos consecutivos

### 2.2 Crear Usuario IAM (Recomendado)

⚠️ **IMPORTANTE**: Nunca uses la cuenta raíz para operaciones diarias

1. **Ir a IAM**:
   - En la barra de búsqueda superior, busca "IAM"
   - Clic en "IAM" en los resultados

2. **Crear usuario**:
   - En el menú lateral: "Users" → "Add users"
   - Nombre de usuario: `admin-proyecto`
   - ✅ Marcar: "Provide user access to the AWS Management Console"
   - Seleccionar: "I want to create an IAM user"
   - Clic en "Next"

3. **Asignar permisos**:
   - Seleccionar: "Attach policies directly"
   - Buscar y marcar: `AdministratorAccess`
   - Clic en "Next"

4. **Revisar y crear**:
   - Clic en "Create user"
   - **⚠️ IMPORTANTE**: Descarga o copia las credenciales
   - Guarda la URL de inicio de sesión del usuario IAM

5. **Cerrar sesión y volver a iniciar**:
   - Cierra sesión de la cuenta raíz
   - Usa la URL del usuario IAM para futuras sesiones

---

## 3. Lanzar Instancia EC2

### 3.1 Acceder a EC2

1. **En la consola de AWS**:
   - Barra de búsqueda: "EC2"
   - Clic en "EC2"

2. **Verificar región**:
   - Arriba a la derecha, verifica la región
   - Recomendado: `us-east-1` (N. Virginia) - más opciones gratuitas
   - O selecciona la región más cercana a tus usuarios

### 3.2 Lanzar Instancia

1. **Iniciar el proceso**:
   - Clic en "Instances" en el menú lateral
   - Clic en botón naranja "Launch instances"

2. **Configuración básica**:
   ```
   Name: servidor-noticias-produccion
   ```

3. **Seleccionar AMI (Imagen)**:
   - En "Application and OS Images"
   - Selecciona: **Ubuntu Server 22.04 LTS**
   - ✅ Verifica que diga "Free tier eligible"
   - Arquitectura: 64-bit (x86)

4. **Tipo de instancia**:
   - Selecciona: **t2.micro** (Free tier eligible)
   - Specs: 1 vCPU, 1 GB RAM
   - ⚠️ **NOTA**: Para tu proyecto con MongoDB + Redis + Cassandra, será ajustado

5. **Key pair (login)**:
   - Clic en "Create new key pair"
   - Configuración:
     ```
     Key pair name: proyecto-noticias-key
     Key pair type: RSA
     Private key file format: .pem (para Linux/Mac) o .ppk (para PuTTY/Windows)
     ```
   - Clic en "Create key pair"
   - **⚠️ CRÍTICO**: El archivo `.pem` se descarga automáticamente
   - **Guárdalo en un lugar seguro** - no podrás descargarlo de nuevo
   - **Nunca lo compartas** - es la llave de acceso a tu servidor

6. **Network settings**:
   - Clic en "Edit" en la sección Network
   - Configuración del Security Group:
     ```
     Security group name: sg-proyecto-noticias
     Description: Security group para proyecto de noticias
     ```
   
   - **Reglas de entrada (Inbound rules)**:
     
     ✅ **Regla 1 - SSH (ya está)**:
     ```
     Type: SSH
     Protocol: TCP
     Port: 22
     Source: My IP (tu IP actual - más seguro)
     Description: SSH access
     ```
     
     ➕ **Agregar regla - Clic en "Add security group rule"**:
     ```
     Type: HTTP
     Protocol: TCP
     Port: 80
     Source: Anywhere (0.0.0.0/0)
     Description: HTTP web traffic
     ```
     
     ➕ **Agregar regla - Clic en "Add security group rule"**:
     ```
     Type: HTTPS
     Protocol: TCP
     Port: 443
     Source: Anywhere (0.0.0.0/0)
     Description: HTTPS web traffic
     ```
     
     ➕ **Agregar regla - Clic en "Add security group rule"**:
     ```
     Type: Custom TCP
     Protocol: TCP
     Port: 8080
     Source: Anywhere (0.0.0.0/0)
     Description: Frontend Nginx
     ```

7. **Configure storage**:
   - Free tier permite hasta **30 GB**
   - Configurar:
     ```
     Size: 30 GiB
     Volume type: gp3 (General Purpose SSD)
     ```
   - ✅ Marca "Delete on termination" (para limpiar al eliminar la instancia)

8. **Advanced details** (Expandir):
   - Dejar todo por defecto
   - O agregar en "User data" (opcional, para automatizar instalación):
     ```bash
     #!/bin/bash
     apt-get update
     apt-get upgrade -y
     ```

9. **Resumen y lanzamiento**:
   - Revisar el panel derecho "Summary"
   - Verificar que diga "Free tier eligible"
   - Clic en "Launch instance"

10. **Confirmación**:
    - Verás mensaje "Successfully initiated launch of instance"
    - Clic en el ID de la instancia (ej: `i-0123456789abcdef0`)
    - Espera 2-3 minutos hasta que "Instance state" = "Running"
    - Y "Status check" = "2/2 checks passed"

### 3.3 Obtener IP Pública

1. **En la lista de instancias**:
   - Selecciona tu instancia
   - En el panel inferior, pestaña "Details"
   - Copia el **"Public IPv4 address"** (ej: `54.123.45.67`)
   - También copia el **"Public IPv4 DNS"** (ej: `ec2-54-123-45-67.compute-1.amazonaws.com`)

---

## 4. Configurar el Servidor

### 4.1 Conectarse por SSH (Linux/Mac/WSL)

1. **Cambiar permisos de la key**:
   ```bash
   cd ~/Downloads  # O donde guardaste la key
   chmod 400 proyecto-noticias-key.pem
   mv proyecto-noticias-key.pem ~/.ssh/  # Moverla a .ssh (opcional pero recomendado)
   ```

2. **Conectarse**:
   ```bash
   ssh -i ~/.ssh/proyecto-noticias-key.pem ubuntu@54.123.45.67
   ```
   - Reemplaza `54.123.45.67` con tu IP pública

3. **Aceptar fingerprint**:
   ```
   The authenticity of host '54.123.45.67' can't be established.
   Are you sure you want to continue connecting (yes/no)? yes
   ```

4. **¡Estás dentro!**:
   ```
   Welcome to Ubuntu 22.04.3 LTS
   ubuntu@ip-172-31-xx-xx:~$
   ```

## 5. Instalar Dependencias

### 5.1 Instalar Docker

```bash
# Actualizar índice de paquetes
sudo apt-get update

# Instalar paquetes necesarios
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Agregar GPG key oficial de Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Configurar repositorio
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Actualizar índice de nuevo
sudo apt-get update

# Instalar Docker Engine
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verificar instalación
sudo docker --version
# Output esperado: Docker version 24.x.x, build xxxxx

# Verificar Docker Compose
sudo docker compose version
# Output esperado: Docker Compose version v2.x.x
```

### 5.2 Configurar Permisos de Docker

```bash
# Agregar usuario ubuntu al grupo docker
sudo usermod -aG docker ubuntu

# IMPORTANTE: Cerrar sesión y volver a conectar para aplicar cambios
exit
```

**Volver a conectar por SSH**:
```bash
ssh -i ~/.ssh/proyecto-noticias-key.pem ubuntu@54.123.45.67
```

**Verificar que funciona sin sudo**:
```bash
docker ps
# Debe funcionar sin errores
```

### 5.3 Instalar Git (si no está)

```bash
# Verificar si git está instalado
git --version

# Si no está, instalar
sudo apt-get install -y git
```

### 5.4 Configurar Swap (Para mejorar rendimiento con 1GB RAM)

⚠️ **CRÍTICO**: Tu proyecto usa MongoDB + Redis + Cassandra, lo cual es pesado para 1GB RAM

```bash
# Verificar si ya existe swap
sudo swapon --show
free -h

# Crear archivo swap de 2GB
sudo fallocate -l 2G /swapfile

# Establecer permisos correctos
sudo chmod 600 /swapfile

# Marcar como swap
sudo mkswap /swapfile

# Activar swap
sudo swapon /swapfile

# Verificar
free -h
# Deberías ver Swap: 2.0Gi

# Hacer permanente (sobrevive reinicios)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimizar uso de swap
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

---

## 6. Clonar y Configurar el Proyecto

### 6.1 Configurar Git (si el repo es privado)

**Si tu repositorio es público**:
```bash
cd ~
git clone https://github.com/Natanoj10/Proyecto-Sitio-Noticias.git
cd Proyecto-Sitio-Noticias
```

### 6.2 Configurar Variables de Entorno

```bash
# Crear archivo .env
nano .env
```

**Contenido del archivo `.env`** (MODIFICAR valores sensibles):
```env
# MongoDB Configuration
MONGO_USER=julian
MONGO_PASS=SuperSecurePassword2024!
MONGO_HOST=mongodb
MONGO_PORT=27017
MONGO_DB=periodico

# Redis Configuration
REDIS_HOST=redisdb
REDIS_PORT=6379

# Backend Configuration
BACKEND_PORT=3000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=tu_secreto_super_seguro_cambialo_123456789
CLAVE=clave_secreta_produccion_007

# Cassandra Configuration (opcional)
CASSANDRA_HOST=cassandra
CASSANDRA_DC=datacenter1
```

**Guardar y salir**:
- Presiona `Ctrl + X`
- Presiona `Y`
- Presiona `Enter`

### 6.3 Verificar Archivos

```bash
# Ver estructura
ls -la

# Verificar docker-compose.yml
cat docker-compose.yml

# Verificar que .env existe
cat .env
```

---

## 8. Desplegar la Aplicación

### 8.1 Construir y Levantar Contenedores

```bash
# Asegúrate de estar en el directorio del proyecto
cd ~/Proyecto-Sitio-Noticias

# Construir imágenes y levantar servicios
docker compose up -d --build

# Ver logs en tiempo real
docker compose logs -f

# Ver estado de contenedores
docker ps

# Ver recursos usados
docker stats
```

**Espera 2-5 minutos** para que Cassandra se inicialice completamente.

### 8.2 Verificar que Todo Funciona

```bash
# Verificar backend
curl http://localhost:3000/api/news

# Verificar Redis
docker exec -it my-redis-container redis-cli ping
# Debe retornar: PONG

# Verificar Cassandra
docker exec -it my-cassandra-container cqlsh -e "DESCRIBE KEYSPACES;"

# Ver logs del backend
docker compose logs backend

# Ver logs de todos los servicios
docker compose logs
```

### 8.4 Acceder desde Internet

**Abrir en navegador**:
```
http://54.123.45.67:8080
```
Reemplaza `54.123.45.67` con tu IP pública de EC2.

**Probar API**:
```
http://54.123.45.67:3000/api/news
```

---
