# Mapa Completo de Puertos - Sistema Biblioteca Digital HENM

**Fecha Actualización:** 29 de Octubre 2025
**Versión:** 2.0
**Branch:** version-funcional-v2.0-koha-autologin
**Estado:** ✅ Sistema Completamente Funcional

---

## 📊 RESUMEN EJECUTIVO DE PUERTOS

### Total de Puertos Utilizados: **16 puertos**

```
Servicios Web Públicos:    6 puertos (80, 4000, 8080, 8081, 8088, 9000)
APIs y Backends:           4 puertos (3000, 8000, 8089, 8090)
Bases de Datos:            2 puertos (3307, 5433)
Servicios de Soporte:      3 puertos (8983, 11212, 4040)
Puerto Nativo Apache:      1 puerto (80 compartido con Staff)
```

---

## 🗺️ MAPA COMPLETO DE PUERTOS

### Tabla Maestra de Puertos

| Puerto | Servicio | Tipo | Host | Protocolo | Acceso | Estado |
|--------|----------|------|------|-----------|--------|--------|
| **80** | **Koha Staff Interface** | **Nativo** | Ubuntu | HTTP | Público | ✅ Activo |
| **3000** | Auth Service API | Docker | auth-service | HTTP | Interno/API | ✅ Activo |
| **3307** | Koha MariaDB | Docker | koha-mariadb | MySQL | Interno | ✅ Activo |
| **4000** | DSpace Angular UI | Docker | dspace-angular | HTTP | Público | ✅ Activo |
| **4040** | ngrok Web Dashboard | Nativo | Host | HTTP | Local | ✅ Activo |
| **5433** | DSpace PostgreSQL | Docker | dspacedb | PostgreSQL | Interno | ✅ Activo |
| **8000** | DSpace Debug Port | Docker | dspace | HTTP | Interno | ✅ Activo |
| **8080** | **Koha OPAC (Catálogo)** | **Nativo** | Ubuntu | HTTP | Público | ✅ Activo |
| **8081** | Koha Web Panel | Docker | koha-web | HTTP | Público | ✅ Activo |
| **8088** | Admin Panel (SSO) | Docker | admin-panel | HTTP | Público | ✅ Activo |
| **8089** | Koha API Proxy | Docker | koha-api | HTTP | Público | ✅ Activo |
| **8090** | DSpace Backend API | Docker | dspace | HTTP | Público | ✅ Activo |
| **8983** | Apache Solr | Docker | dspacesolr | HTTP | Interno | ✅ Activo |
| **9000** | **Proxy Unificado ngrok** | **Docker** | ngrok-proxy | HTTP | **Público** | ✅ Activo |
| **11212** | Koha Memcached | Docker | koha-memcached | Memcache | Interno | ✅ Activo |

---

## 🎯 PUERTOS POR CATEGORÍA

### 1. Servicios Web Públicos (Acceso del Usuario)

#### Puerto 80 - Koha Staff Interface ⭐
```yaml
Servicio: Apache2 (Koha Intranet)
Tipo: Nativo Ubuntu
URL Local: http://172.27.72.64/
URL ngrok: https://...ngrok-free.dev/koha-staff/
Descripción: Interfaz administrativa de Koha para bibliotecarios
Usuarios: Administradores, bibliotecarios
Auto-login: ✅ Implementado (koha-staff-auto-login.html)
```

#### Puerto 4000 - DSpace Angular Frontend ⭐
```yaml
Servicio: DSpace 7.x UI (Angular)
Tipo: Docker (dspace-angular)
URL Local: http://172.27.72.64:4000
URL ngrok: https://...ngrok-free.dev/dspace/
Descripción: Repositorio digital institucional
Usuarios: Todos
Auto-login: ✅ Implementado (dspace-auto-login.html)
```

#### Puerto 8080 - Koha OPAC (Catálogo Público) ⭐
```yaml
Servicio: Apache2 (Koha OPAC)
Tipo: Nativo Ubuntu
URL Local: http://172.27.72.64:8080
URL ngrok: https://...ngrok-free.dev/koha/
Descripción: Catálogo público de biblioteca
Usuarios: Estudiantes, público general
Auto-login: ✅ Implementado (koha-opac-auto-login.html)
```

#### Puerto 8081 - Koha Web Panel
```yaml
Servicio: Nginx (contenido estático)
Tipo: Docker (koha-web)
URL Local: http://172.27.72.64:8081
Descripción: Archivos estáticos de Koha
Usuarios: Sistema interno
```

#### Puerto 8088 - Admin Panel (SSO) ⭐⭐⭐
```yaml
Servicio: Panel de Administración SSO
Tipo: Docker (admin-panel)
URL Local: http://172.27.72.64:8088
URL ngrok: https://...ngrok-free.dev/
Descripción: Panel de login unificado y dashboard
Usuarios: TODOS (punto de entrada principal)
Características:
  - Login único
  - Dashboard con acceso a todos los sistemas
  - Auto-login a DSpace, Koha OPAC, Koha Staff
  - Gestión de sesiones
```

#### Puerto 9000 - Proxy Unificado ⭐⭐⭐
```yaml
Servicio: Nginx Reverse Proxy
Tipo: Docker (ngrok-proxy)
URL Local: http://localhost:9000
Descripción: Punto central para ngrok - enruta todo el tráfico
Rutas:
  / → admin-panel:8088
  /dspace/ → dspace-angular:4000
  /koha/ → koha-opac:8080
  /koha-staff/ → koha-staff:80
  /api/ → auth-service:3000
Importancia: CRÍTICO - Punto único de acceso para ngrok
```

---

### 2. APIs y Backends

#### Puerto 3000 - Auth Service API
```yaml
Servicio: API de Autenticación (Node.js)
Tipo: Docker (auth-service)
URL: http://172.27.72.64:3000
Endpoints:
  /api/login - Login de usuarios
  /api/logout - Cerrar sesión
  /api/validate - Validar sesión
  /api/users - Gestión de usuarios
  /api/appointments - Sistema de citas
  /health - Health check
Usuarios: Sistema interno (llamadas desde panel)
Base de Datos: PostgreSQL (biblioteca_auth)
```

#### Puerto 8000 - DSpace Debug Port
```yaml
Servicio: Puerto de depuración de DSpace
Tipo: Docker (dspace)
Uso: Debugging de Java/Tomcat
Acceso: Interno
```

#### Puerto 8089 - Koha API Proxy
```yaml
Servicio: Proxy de API de Koha
Tipo: Docker (koha-api)
URL: http://172.27.72.64:8089
Descripción: Proxy para futuras integraciones con API de Koha
Estado: Placeholder
```

#### Puerto 8090 - DSpace Backend API
```yaml
Servicio: DSpace REST API
Tipo: Docker (dspace)
URL: http://172.27.72.64:8090/server
Endpoints:
  /server/api/authn/login - Autenticación
  /server/api/core/items - Gestión de items
  /server/api/core/collections - Colecciones
  /server/api/discover/search - Búsqueda
Usuarios: dspace-angular (frontend)
Base de Datos: PostgreSQL (dspace)
```

---

### 3. Bases de Datos

#### Puerto 3307 - Koha MariaDB
```yaml
Servicio: MariaDB 10.11
Tipo: Docker (koha-mariadb)
Host: 0.0.0.0:3307 → 3306 (interno)
Credenciales:
  Usuario: koha_library
  Password: ${MYSQL_PASSWORD}
  Base de Datos: koha_library
Tablas Principales:
  - borrowers (usuarios)
  - biblio (bibliografía)
  - items (ejemplares)
  - issues (préstamos)
  - sessions (sesiones)
Acceso: Interno (contenedores Docker + host)
⚠️ ADVERTENCIA: Expuesto en 0.0.0.0 - En producción usar 127.0.0.1
```

#### Puerto 5433 - DSpace PostgreSQL
```yaml
Servicio: PostgreSQL 14 con pgcrypto
Tipo: Docker (dspacedb)
Host: 0.0.0.0:5433 → 5432 (interno)
Credenciales:
  Usuario: dspace
  Password: ${POSTGRES_PASSWORD}
  Bases de Datos:
    - dspace (repositorio)
    - biblioteca_auth (autenticación)
Acceso: Interno (contenedores Docker + host)
⚠️ ADVERTENCIA: Expuesto en 0.0.0.0 - En producción usar 127.0.0.1
```

---

### 4. Servicios de Soporte

#### Puerto 8983 - Apache Solr
```yaml
Servicio: Apache Solr (motor de búsqueda)
Tipo: Docker (dspacesolr)
URL: http://localhost:8983/solr
Descripción: Índices de búsqueda para DSpace
Cores:
  - search
  - statistics
  - authority
Acceso: Interno
Uso: DSpace backend para búsquedas
```

#### Puerto 11212 - Koha Memcached
```yaml
Servicio: Memcached (caché en memoria)
Tipo: Docker (koha-memcached)
Host: 0.0.0.0:11212 → 11211 (interno)
Memoria: 128 MB
Descripción: Caché para mejorar rendimiento de Koha
Acceso: Interno
Uso: Koha para cachear consultas frecuentes
```

#### Puerto 4040 - ngrok Web Dashboard
```yaml
Servicio: Panel web de ngrok
Tipo: Nativo (proceso ngrok)
URL: http://localhost:4040
Descripción: Interfaz web para monitorear túneles ngrok
Características:
  - Ver requests en tiempo real
  - Inspeccionar headers y payloads
  - Estadísticas de uso
  - Replay de requests
Acceso: Solo localhost
```

---

## 🌐 ARQUITECTURA DE RED

### Flujo de Tráfico (Usuario → Sistema)

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
│            (Usuario desde cualquier lugar)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    ngrok Tunnel                              │
│     https://bolshevistically-prototypal-dorris.ngrok...     │
│                 (Túnel seguro HTTPS)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Localhost:9000 (Proxy Unificado)                │
│                  nginx-proxy container                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Enrutamiento por Path:                                │  │
│  │ /               → localhost:8088 (Admin Panel)        │  │
│  │ /dspace/        → localhost:4000 (DSpace UI)          │  │
│  │ /koha/          → localhost:8080 (Koha OPAC)          │  │
│  │ /koha-staff/    → localhost:80   (Koha Staff)         │  │
│  │ /api/           → localhost:3000 (Auth Service)       │  │
│  └───────────────────────────────────────────────────────┘  │
└────────┬────────┬────────┬────────┬────────┬────────────────┘
         │        │        │        │        │
         ▼        ▼        ▼        ▼        ▼
    ┌────────┐ ┌────┐ ┌────┐ ┌────┐ ┌─────────┐
    │Admin   │ │DSp │ │Koha│ │Koha│ │Auth     │
    │Panel   │ │ace │ │OPAC│ │Stf │ │Service  │
    │:8088   │ │:400│ │:808│ │:80 │ │:3000    │
    └────────┘ └──┬─┘ └────┘ └────┘ └────┬────┘
                  │                       │
                  ▼                       ▼
            ┌──────────┐           ┌──────────┐
            │DSpace    │           │Auth      │
            │Backend   │           │Database  │
            │:8090     │           │:5433     │
            └────┬─────┘           └──────────┘
                 │
                 ▼
            ┌──────────┐
            │DSpace    │
            │Database  │
            │:5433     │
            └──────────┘
```

### Red Docker (dspacenet)

```yaml
Network: dspacenet
Subnet: 172.23.0.0/16

Contenedores Conectados:
  ✅ dspace (172.23.0.x)
  ✅ dspace-angular (172.23.0.x)
  ✅ dspacedb (172.23.0.x)
  ✅ dspacesolr (172.23.0.x)
  ✅ auth-service (172.23.0.x)
  ✅ koha-mariadb (172.23.0.x)
  ✅ koha-memcached (172.23.0.x)
  ✅ koha-web (172.23.0.x)
  ✅ koha-api (172.23.0.x)
  ✅ admin-panel (172.23.0.x)
  ✅ ngrok-proxy (172.23.0.x)

Comunicación Interna:
  - Contenedores se comunican por nombre (ej: http://dspace:8080)
  - No necesitan usar localhost o IPs externas
  - DNS interno de Docker resuelve nombres
```

### Servicios Nativos (Host Ubuntu)

```
Host: 172.17.0.1 (desde perspectiva de Docker)
Host: 172.27.72.64 (IP de WSL)

Servicios Corriendo:
  ✅ Apache2
     - Puerto 80: Koha Staff Interface
     - Puerto 8080: Koha OPAC
  ✅ koha-common (zebra, workers, indexer)
  ✅ ngrok (proceso nativo)
     - Túnel: 9000 → ngrok servers
     - Dashboard: 4040
```

---

## 📋 CONFIGURACIÓN DE docker-compose.yml

### Mapeo de Puertos Docker

```yaml
# DSpace Backend
dspace:
  ports:
    - "8090:8080"  # API REST (externo:interno)
    - "8000:8000"  # Debug port

# DSpace Frontend
dspace-angular:
  ports:
    - "4000:4000"  # UI Angular

# DSpace Database
dspacedb:
  ports:
    - "5433:5432"  # PostgreSQL
    # ⚠️ Cambiar a "127.0.0.1:5433:5432" en producción

# DSpace Solr
dspacesolr:
  ports:
    - "8983:8983"  # Solr web UI

# Auth Service
auth-service:
  ports:
    - "3000:3000"  # API Node.js

# Koha MariaDB
koha-mariadb:
  ports:
    - "3307:3306"  # MySQL
    # ⚠️ Cambiar a "127.0.0.1:3307:3306" en producción

# Koha Memcached
koha-memcached:
  ports:
    - "11212:11211"  # Memcache

# Koha Web Panel
koha-web:
  ports:
    - "8081:80"  # Static files

# Koha API Proxy
koha-api:
  ports:
    - "8089:80"  # API proxy

# Admin Panel
admin-panel:
  ports:
    - "8088:80"  # SSO Panel

# Proxy Unificado
ngrok-proxy:
  ports:
    - "9000:80"  # Reverse proxy
```

---

## 🔒 SEGURIDAD DE PUERTOS

### ⚠️ Puertos Expuestos Inseguramente (Acción Requerida)

#### Bases de Datos en 0.0.0.0:
```yaml
PROBLEMA:
  - Puerto 3307 (MariaDB): 0.0.0.0:3307 → Accesible desde Internet
  - Puerto 5433 (PostgreSQL): 0.0.0.0:5433 → Accesible desde Internet

RIESGO:
  - Ataques de fuerza bruta
  - Acceso no autorizado a datos sensibles
  - Exposición de credenciales

SOLUCIÓN RECOMENDADA:
  # En docker-compose.yml cambiar:
  ports:
    - "127.0.0.1:5433:5432"  # Solo localhost
    - "127.0.0.1:3307:3306"  # Solo localhost

  # O comentar completamente si no se necesita acceso externo:
  # ports:
  #   - "5433:5432"
```

### ✅ Puertos Seguros

```
Puerto 9000 (Proxy): Detrás de ngrok con HTTPS ✅
Puerto 4000 (DSpace): Detrás de proxy ✅
Puerto 8088 (Panel): Detrás de proxy ✅
Puerto 80/8080 (Koha): Detrás de proxy ✅
Puerto 3000 (Auth): Detrás de proxy ✅
```

### 🛡️ Firewall Recomendado

```bash
# UFW (Ubuntu Firewall)
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir solo SSH
sudo ufw allow 22/tcp

# Denegar acceso directo a bases de datos desde Internet
sudo ufw deny 3307/tcp
sudo ufw deny 5433/tcp

# Permitir ngrok y servicios web localmente
# (no es necesario abrir puertos, ngrok hace el túnel)

sudo ufw enable
```

---

## 🧪 VERIFICACIÓN DE PUERTOS

### Comandos de Verificación

```bash
# Ver todos los puertos en uso
sudo netstat -tlnp | grep LISTEN

# Ver puertos Docker
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Ver proceso específico en puerto
sudo lsof -i :9000

# Probar conectividad
curl -I http://localhost:8088
curl -I http://localhost:4000
curl -I http://localhost:9000

# Ver túneles ngrok
curl -s http://localhost:4040/api/tunnels | python3 -m json.tool
```

### Verificación de Servicios

```bash
# Admin Panel
curl -s http://localhost:8088/ | head -5

# DSpace UI
curl -s http://localhost:4000/ | head -5

# DSpace API
curl -s http://localhost:8090/server/api | head -5

# Auth Service
curl -s http://localhost:3000/health

# Proxy Unificado (debe retornar admin panel)
curl -s http://localhost:9000/ | head -5

# Koha OPAC
curl -I http://localhost:8080/

# Koha Staff
curl -I http://localhost:80/
```

### Script de Verificación Rápida

```bash
#!/bin/bash
echo "Verificando puertos del sistema..."
echo ""

puertos=(80 3000 3307 4000 4040 5433 8000 8080 8081 8088 8089 8090 8983 9000 11212)

for puerto in "${puertos[@]}"; do
    if sudo lsof -i :$puerto > /dev/null 2>&1; then
        servicio=$(sudo lsof -i :$puerto | tail -1 | awk '{print $1}')
        echo "✅ Puerto $puerto: $servicio"
    else
        echo "❌ Puerto $puerto: NO ACTIVO"
    fi
done
```

---

## 📊 PUERTOS POR TECNOLOGÍA

### Node.js
- **3000** - Auth Service API

### Java/Tomcat
- **8090** - DSpace Backend (puerto 8080 interno mapeado a 8090)
- **8000** - DSpace Debug Port

### Angular
- **4000** - DSpace Frontend

### Nginx
- **8081** - Koha Web (archivos estáticos)
- **8088** - Admin Panel
- **8089** - Koha API Proxy
- **9000** - Proxy Unificado

### Apache2 (Nativo)
- **80** - Koha Staff Interface
- **8080** - Koha OPAC

### Bases de Datos
- **3307** - MariaDB (Koha)
- **5433** - PostgreSQL (DSpace + Auth)

### Servicios
- **8983** - Apache Solr (búsqueda)
- **11212** - Memcached (caché)
- **4040** - ngrok Dashboard

---

## 🎯 PUERTOS PARA ACCESO DEL USUARIO

### Acceso Directo (Desarrollo Local)

```
Panel Principal:      http://172.27.72.64:8088
DSpace:              http://172.27.72.64:4000
Koha OPAC:           http://172.27.72.64:8080
Koha Staff:          http://172.27.72.64/
Auth API:            http://172.27.72.64:3000
```

### Acceso vía ngrok (Producción/Demo)

```
URL Base: https://bolshevistically-prototypal-dorris.ngrok-free.dev

Panel Principal:      https://...ngrok-free.dev/
DSpace:              https://...ngrok-free.dev/dspace/
Koha OPAC:           https://...ngrok-free.dev/koha/
Koha Staff:          https://...ngrok-free.dev/koha-staff/
Auth API:            https://...ngrok-free.dev/api/

Todos apuntan al puerto 9000 localmente
```

---

## 🚫 PUERTOS A EVITAR EN NUEVOS PROYECTOS

### Puertos Ocupados por Este Proyecto

```
NO USAR:
80, 3000, 3307, 4000, 4040, 5433,
8000, 8080, 8081, 8088, 8089, 8090,
8983, 9000, 11212
```

### Puertos Recomendados para Otros Proyectos

```
APLICACIONES WEB:
3001-3006, 8091-8099, 8100-8200, 9001-9099

BASES DE DATOS:
3308-3320 (MySQL/MariaDB)
5434-5450 (PostgreSQL)
27017 (MongoDB)
6379 (Redis)

DESARROLLO:
3010-3020 (Node.js apps)
8100-8110 (Web apps)
9100-9110 (Proxies)
```

---

## 🔄 CAMBIOS RECIENTES EN PUERTOS

### Historial de Configuración

| Fecha | Cambio | Puertos Afectados | Razón |
|-------|--------|-------------------|-------|
| 29-Oct-2025 | Documentación actualizada | Todos | Versión funcional v2.0 |
| 21-Oct-2025 | Fix auto-login local | 80, 8080 | Corrección de URLs |
| 15-Oct-2025 | Proxy unificado | 9000 | ngrok plan gratuito |
| 11-Oct-2025 | Primera configuración ngrok | 8088 | Acceso público |
| 8-Oct-2025 | Instalación Koha nativo | 80, 8080 | Koha en Ubuntu |

---

## 📖 DOCUMENTACIÓN RELACIONADA

### Archivos del Proyecto

- `docker-compose.yml` - Configuración completa de puertos
- `nginx-proxy-unified.conf` - Enrutamiento del proxy
- `VERSION_FUNCIONAL_KOHA_AUTOLOGIN.md` - Documentación maestra
- `PUERTOS_Y_NGROK_REFERENCIA.md` - Guía original de puertos
- `.env` - Variables de entorno y credenciales

### Comandos Útiles

```bash
# Ver este documento
cat MAPA_PUERTOS_ACTUALIZADO.md

# Ver configuración de docker
cat docker-compose.yml | grep -A 2 "ports:"

# Ver configuración de proxy
cat nginx-proxy-unified.conf

# Ver estado de servicios
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## ✅ CHECKLIST DE VALIDACIÓN DE PUERTOS

### Antes de Iniciar el Sistema

- [ ] Verificar que no hay conflictos de puertos: `sudo netstat -tlnp`
- [ ] Confirmar que Docker está corriendo: `docker ps`
- [ ] Verificar que Apache está corriendo: `systemctl status apache2`
- [ ] Confirmar que Koha está activo: `systemctl status koha-common`

### Después de Iniciar el Sistema

- [ ] Admin Panel responde en 8088: `curl -I http://localhost:8088`
- [ ] DSpace UI responde en 4000: `curl -I http://localhost:4000`
- [ ] DSpace API responde en 8090: `curl -I http://localhost:8090/server/api`
- [ ] Auth Service responde en 3000: `curl http://localhost:3000/health`
- [ ] Proxy responde en 9000: `curl -I http://localhost:9000`
- [ ] Koha OPAC responde en 8080: `curl -I http://localhost:8080`
- [ ] Koha Staff responde en 80: `curl -I http://localhost:80`
- [ ] ngrok dashboard disponible: `curl -I http://localhost:4040`

### Validación de Conectividad

- [ ] Todos los contenedores Docker corriendo: `docker ps | wc -l` >= 11
- [ ] Bases de datos accesibles (interno)
- [ ] ngrok túnel activo: `pgrep ngrok`
- [ ] URL pública de ngrok funcionando

---

## 📞 TROUBLESHOOTING DE PUERTOS

### Puerto Ya en Uso

```bash
# Identificar proceso
sudo lsof -i :PUERTO

# Ejemplo para puerto 9000
sudo lsof -i :9000

# Matar proceso
kill -9 PID

# O detener contenedor
docker stop NOMBRE_CONTENEDOR
```

### Contenedor No Inicia por Puerto Ocupado

```bash
# Ver error
docker logs NOMBRE_CONTENEDOR

# Detener servicio conflictivo
sudo systemctl stop SERVICIO

# O cambiar puerto en docker-compose.yml
# Ejemplo: "9001:80" en lugar de "9000:80"
```

### No Puedo Acceder a un Puerto

```bash
# Verificar firewall
sudo ufw status

# Verificar que el servicio esté escuchando
sudo netstat -tlnp | grep :PUERTO

# Verificar en Docker
docker port NOMBRE_CONTENEDOR
```

---

**Versión:** 2.0
**Última Actualización:** 29 de Octubre 2025
**Autor:** Sistema SSO HENM
**Estado:** ✅ Documentación Completa y Actualizada
