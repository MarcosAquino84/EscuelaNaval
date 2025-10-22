# Guía de Puertos y Configuración ngrok
## Sistema Biblioteca Digital HENM - Referencia Completa

**Fecha:** 21 de Octubre 2025
**Propósito:** Documentación de puertos ocupados y configuración ngrok para evitar conflictos en futuros proyectos

---

## 📊 MAPA COMPLETO DE PUERTOS UTILIZADOS

### Puertos en Uso - Proyecto Actual

| Puerto | Servicio | Tipo | Protocolo | Acceso | Contenedor/Host |
|--------|----------|------|-----------|--------|-----------------|
| **80** | Koha Apache (Staff) | Nativo | HTTP | Público | Host Ubuntu |
| **3000** | Auth Service API | Docker | HTTP | Interno/API | auth-service |
| **3307** | Koha MariaDB | Docker | MySQL | Interno | koha-mariadb |
| **4000** | DSpace Angular Frontend | Docker | HTTP | Público | dspace-angular |
| **4040** | ngrok Web UI (primario) | Nativo | HTTP | Local | Host (si disponible) |
| **4041** | ngrok Web UI (alternativo) | Nativo | HTTP | Local | Host (actual) |
| **5433** | DSpace PostgreSQL | Docker | PostgreSQL | Interno | dspacedb |
| **8000** | DSpace Debug Port | Docker | HTTP | Interno | dspace |
| **8080** | Koha OPAC | Nativo | HTTP | Público | Host Ubuntu |
| **8081** | Koha Web Panel | Docker | HTTP | Público | koha-web |
| **8088** | Admin Panel | Docker | HTTP | Público | admin-panel |
| **8089** | Koha API Proxy | Docker | HTTP | Público | koha-api |
| **8090** | DSpace Backend API | Docker | HTTP | Público | dspace |
| **8983** | Apache Solr | Docker | HTTP | Interno | dspacesolr |
| **9000** | Proxy Unificado (ngrok) | Docker | HTTP | Público | ngrok-proxy |
| **11212** | Koha Memcached | Docker | Memcached | Interno | koha-memcached |

### Total de Puertos Ocupados: 16

---

## 🔒 PUERTOS RESERVADOS DEL SISTEMA

**NO utilizar estos puertos en futuros proyectos:**

```
Rango de puertos ocupados:
- 80, 3000, 3307, 4000, 4041, 5433
- 8000, 8080, 8081, 8088, 8089, 8090, 8983
- 9000, 11212
```

---

## 🆓 PUERTOS RECOMENDADOS PARA OTROS PROYECTOS

### Rangos Seguros (No Conflicto)

**Aplicaciones Web:**
```
3001-3006     (6 puertos disponibles cerca de auth-service)
8091-8099     (9 puertos después de DSpace)
8100-8200     (100 puertos disponibles)
9001-9099     (99 puertos después de proxy ngrok)
```

**Bases de Datos:**
```
3308-3320     (MySQL/MariaDB - después de 3307)
5434-5450     (PostgreSQL - después de 5433)
27017-27020   (MongoDB - rango estándar)
6379-6389     (Redis - rango estándar)
```

**Otros Servicios:**
```
6000-6100     (APIs diversas)
7000-7100     (Microservicios)
10000-10100   (Servicios internos)
```

### Ejemplos de Configuración para Nuevos Proyectos

**Proyecto Node.js:**
```yaml
services:
  app:
    ports:
      - "3001:3000"  # Evita conflicto con auth-service (3000)

  db:
    ports:
      - "5434:5432"  # Evita conflicto con dspacedb (5433)
```

**Proyecto Laravel:**
```yaml
services:
  app:
    ports:
      - "8091:80"    # Evita conflicto con DSpace (8090)

  mysql:
    ports:
      - "3308:3306"  # Evita conflicto con koha-mariadb (3307)
```

**Proyecto React:**
```yaml
services:
  frontend:
    ports:
      - "3002:3000"  # Evita conflicto con auth-service
```

---

## 🌐 CONFIGURACIÓN COMPLETA DE NGROK

### Información del Túnel Actual

**URL Pública Activa:**
```
https://bolshevistically-prototypal-dorris.ngrok-free.dev
```

**Configuración:**
- **Token:** `33vq8HOK3jOdFSHeyyhALkir9Rv_6BArP9DV6HGo9kgY7tuSX`
- **Puerto Local:** 9000 (Proxy Unificado)
- **Región:** US (automática)
- **Panel Web:** http://localhost:4041
- **Archivo Config:** `~/.config/ngrok/ngrok.yml`
- **PID Actual:** Variable (verificar con `ps aux | grep ngrok`)

### Archivo de Configuración ngrok

**Ubicación:** `~/.config/ngrok/ngrok.yml`

```yaml
version: "3"
agent:
    authtoken: 33vq8HOK3jOdFSHeyyhALkir9Rv_6BArP9DV6HGo9kgY7tuSX
```

### Comandos ngrok Útiles

**Ver túneles activos:**
```bash
curl -s http://localhost:4041/api/tunnels | python3 -m json.tool
```

**Iniciar túnel simple:**
```bash
/home/marcos/ngrok http 9000
```

**Iniciar túnel con subdomain (requiere plan de pago):**
```bash
/home/marcos/ngrok http 9000 --subdomain=biblioteca-henm
```

**Iniciar múltiples túneles (requiere plan de pago):**
```bash
/home/marcos/ngrok start admin-panel auth-service --config ngrok.yml
```

**Detener ngrok:**
```bash
pkill -9 ngrok
```

**Ver logs en tiempo real:**
```bash
tail -f /home/marcos/EscuelaNaval/ngrok.log
```

---

## 🔀 ARQUITECTURA DE PROXY UNIFICADO

### Diagrama de Flujo

```
Internet
    ↓
https://bolshevistically-prototypal-dorris.ngrok-free.dev
    ↓
ngrok (túnel seguro)
    ↓
localhost:9000 (Proxy Unificado - nginx)
    ↓
┌─────────────────────────────────────────────┐
│                                             │
│  /                → localhost:8088 (Admin)  │
│  /dspace/         → localhost:4000 (DSpace) │
│  /koha/           → localhost:8080 (OPAC)   │
│  /koha-staff/     → localhost:80 (Staff)    │
│  /api/            → localhost:3000 (Auth)   │
│                                             │
└─────────────────────────────────────────────┘
```

### Configuración del Proxy (nginx-proxy)

**Contenedor:** `ngrok-proxy`
**Puerto:** 9000
**Imagen:** nginx:alpine

**Configuración de rutas:**

| Ruta Externa | Servicio Interno | Puerto |
|--------------|------------------|--------|
| `/` | admin-panel | 8088 |
| `/dspace/` | dspace-angular | 4000 |
| `/koha/` | koha-opac | 8080 |
| `/koha-staff/` | koha-staff (Apache) | 80 |
| `/api/` | auth-service | 3000 |

---

## 📁 ARCHIVOS DE CONFIGURACIÓN NGROK

### Archivos del Proyecto

```
/home/marcos/EscuelaNaval/
├── ngrok.yml                    # Config multi-túnel (plan de pago)
├── ngrok-free.yml               # Config para plan gratuito
├── ngrok-url.txt                # URL pública actual
├── ngrok.log                    # Logs de ngrok
├── ngrok-auth.log              # Logs de autenticación
├── iniciar-ngrok.sh            # Script de inicio automático
└── actualizar-urls-ngrok.sh    # Script para actualizar URLs

/home/marcos/
└── ngrok                        # Binario de ngrok (ejecutable)

~/.config/ngrok/
└── ngrok.yml                    # Configuración global de ngrok
```

### Contenido de ngrok.yml (Multi-túnel)

```yaml
version: "2"
authtoken: 33vq8HOK3jOdFSHeyyhALkir9Rv_6BArP9DV6HGo9kgY7tuSX

tunnels:
  # Admin Panel - Login y Dashboard principal
  admin-panel:
    addr: 8088
    proto: http
    bind_tls: true
    inspect: true
    metadata: "Admin Panel - Sistema de Biblioteca HENM"

  # Auth Service - API de autenticación y gestión de citas
  auth-service:
    addr: 3000
    proto: http
    bind_tls: true
    inspect: true
    metadata: "Auth Service - API Backend"

  # DSpace - Repositorio Digital Institucional
  dspace:
    addr: 4000
    proto: http
    bind_tls: true
    inspect: true
    metadata: "DSpace - Repositorio Digital"

  # DSpace API - Backend REST API
  dspace-api:
    addr: 8090
    proto: http
    bind_tls: true
    inspect: true
    metadata: "DSpace API - Backend REST"

  # Koha OPAC - Catálogo Público
  koha-opac:
    addr: 8081
    proto: http
    bind_tls: true
    inspect: true
    metadata: "Koha OPAC - Catálogo Público"

  # Koha Staff - Interfaz de Administración
  koha-staff:
    addr: 8089
    proto: http
    bind_tls: true
    inspect: true
    metadata: "Koha Staff - Administración Bibliotecaria"

# NOTA: El plan gratuito de ngrok permite máximo 1 túnel simultáneo
```

---

## 🚀 CÓMO USAR NGROK EN OTROS PROYECTOS

### Escenario 1: Proyecto Simple (1 Puerto)

**Ejemplo: API Node.js en puerto 3001**

```bash
# Iniciar ngrok apuntando al puerto 3001
/home/marcos/ngrok http 3001

# Obtendrás una URL como:
# https://abc123.ngrok-free.dev
```

**Configuración del proyecto:**
```yaml
# docker-compose.yml
services:
  api:
    ports:
      - "3001:3000"  # Puerto 3001 (externo) → 3000 (interno del contenedor)
```

### Escenario 2: Aplicación Web + API (2 Servicios)

**Ejemplo: Frontend React (3002) + Backend Express (3001)**

**Opción A: Plan Gratuito (solo 1 túnel)**

```bash
# Crear proxy nginx en puerto 10000
# docker-compose.yml
services:
  proxy:
    image: nginx:alpine
    ports:
      - "10000:80"
    # Configurar nginx para enrutar /api → 3001 y / → 3002

# Iniciar ngrok en el proxy
/home/marcos/ngrok http 10000
```

**Opción B: Plan de Pago (múltiples túneles)**

```bash
# Crear ngrok-proyecto.yml
version: "2"
authtoken: TU_TOKEN_AQUI

tunnels:
  frontend:
    addr: 3002
    proto: http
  backend:
    addr: 3001
    proto: http

# Iniciar ambos túneles
ngrok start frontend backend --config ngrok-proyecto.yml
```

### Escenario 3: Proyecto con Base de Datos

**Ejemplo: App + PostgreSQL**

```yaml
# docker-compose.yml
services:
  app:
    ports:
      - "8100:80"       # Puerto web

  db:
    ports:
      - "5450:5432"     # PostgreSQL (SOLO para desarrollo local)
    # IMPORTANTE: NO exponer BD a Internet con ngrok
```

```bash
# Solo exponer la app, NO la base de datos
/home/marcos/ngrok http 8100
```

**⚠️ NUNCA exponer bases de datos a Internet con ngrok**

### Escenario 4: Proyecto con Subdominio Personalizado

**Requiere plan de pago de ngrok**

```bash
# Con subdomain personalizado
/home/marcos/ngrok http 8100 --subdomain=mi-proyecto

# URL resultante:
# https://mi-proyecto.ngrok-free.dev
```

---

## 🔍 VERIFICACIÓN Y DEBUGGING

### Comandos de Verificación

**Ver puertos en uso:**
```bash
# Todos los puertos TCP en LISTEN
sudo netstat -tlnp

# Filtrar por puerto específico
sudo netstat -tlnp | grep :8088

# Ver con lsof
sudo lsof -i :8088
```

**Ver contenedores y sus puertos:**
```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

**Verificar servicios respondiendo:**
```bash
curl -I http://localhost:8088
curl -I http://localhost:4000
curl -I http://localhost:3000/health
```

**Ver túneles ngrok activos:**
```bash
curl -s http://localhost:4041/api/tunnels | python3 -m json.tool
```

**Logs de ngrok:**
```bash
# Ver logs en tiempo real
tail -f /home/marcos/EscuelaNaval/ngrok.log

# Ver últimas 50 líneas
tail -50 /home/marcos/EscuelaNaval/ngrok.log
```

### Solución de Problemas Comunes

**Problema: Puerto ya en uso**

```bash
# Identificar qué proceso usa el puerto
sudo lsof -i :PUERTO

# Matar proceso por PID
kill -9 PID

# O detener contenedor Docker
docker stop NOMBRE_CONTENEDOR
```

**Problema: ngrok dice "endpoint already online"**

```bash
# Detener todos los procesos ngrok
pkill -9 ngrok

# Esperar 5 segundos
sleep 5

# Iniciar de nuevo
/home/marcos/ngrok http 9000
```

**Problema: No se puede acceder a ngrok URL**

```bash
# 1. Verificar que ngrok esté corriendo
ps aux | grep ngrok

# 2. Verificar el puerto local
curl -I http://localhost:9000

# 3. Ver panel de ngrok
open http://localhost:4041  # o firefox http://localhost:4041

# 4. Verificar logs
tail -50 /home/marcos/EscuelaNaval/ngrok.log
```

---

## 📋 CHECKLIST PARA NUEVOS PROYECTOS

### Antes de Iniciar un Nuevo Proyecto

- [ ] **Revisar puertos disponibles** (usar rangos seguros)
- [ ] **Documentar puertos elegidos** en README del proyecto
- [ ] **Verificar conflictos** con `netstat -tlnp`
- [ ] **Configurar docker-compose.yml** con puertos no utilizados
- [ ] **Probar localmente** antes de configurar ngrok
- [ ] **Si se necesita ngrok:**
  - [ ] Elegir puerto para el proxy (ej: 10000+)
  - [ ] Configurar proxy nginx si hay múltiples servicios
  - [ ] Iniciar túnel ngrok
  - [ ] Documentar URL pública generada
  - [ ] Actualizar variables de entorno si es necesario

### Template para Documentar Puertos en Nuevo Proyecto

```markdown
# Puertos Utilizados - [Nombre del Proyecto]

| Puerto | Servicio | Tipo | Acceso |
|--------|----------|------|--------|
| XXXX   | Nombre   | HTTP | Público/Interno |

## ngrok
- Puerto Proxy: XXXX
- URL Pública: https://XXXXX.ngrok-free.dev
- Comando: `ngrok http XXXX`
```

---

## 🔐 SEGURIDAD Y MEJORES PRÁCTICAS

### Puertos y Acceso

**✅ Buenas Prácticas:**

1. **Bases de datos SOLO en localhost**
   ```yaml
   # Correcto - Solo accesible desde el host
   db:
     ports:
       - "127.0.0.1:5433:5432"
   ```

2. **APIs internas sin exposición pública**
   ```yaml
   # No exponer servicios internos
   redis:
     # No incluir 'ports:' si solo se usa internamente
   ```

3. **Usar redes Docker para comunicación interna**
   ```yaml
   networks:
     - internal-network
   ```

**❌ Evitar:**

1. **Exponer bases de datos a Internet**
   ```yaml
   # MAL - Base de datos accesible públicamente
   db:
     ports:
       - "0.0.0.0:5432:5432"  # ❌ PELIGROSO
   ```

2. **Usar puertos privilegiados sin razón**
   ```yaml
   # Evitar puertos < 1024 (requieren root)
   # Usar 8080 en lugar de 80
   ```

3. **Reutilizar puertos de servicios comunes**
   ```yaml
   # Evitar puertos estándar ya ocupados:
   # 22 (SSH), 80 (HTTP), 443 (HTTPS), 3306 (MySQL), etc.
   ```

### ngrok Seguridad

**✅ Recomendaciones:**

1. **No compartir tu authtoken**
   ```bash
   # Nunca hacer commit del token en git
   echo "ngrok.yml" >> .gitignore
   ```

2. **Usar autenticación básica si es posible (plan de pago)**
   ```bash
   ngrok http 8080 -auth="usuario:password"
   ```

3. **Limitar tiempo de exposición**
   ```bash
   # Detener ngrok cuando no se use
   pkill ngrok
   ```

4. **Revisar logs regularmente**
   ```bash
   # Verificar accesos sospechosos en panel web
   open http://localhost:4041
   ```

---

## 📊 TABLA DE REFERENCIA RÁPIDA

### Puertos Proyecto Actual

```
PÚBLICOS (Web):
80, 4000, 8080, 8081, 8088, 9000

INTERNOS (APIs):
3000, 8000, 8089, 8090

BASES DE DATOS:
3307 (MariaDB), 5433 (PostgreSQL)

SERVICIOS:
8983 (Solr), 11212 (Memcached), 4041 (ngrok UI)
```

### Comandos Rápidos

```bash
# Ver todos los puertos en uso
sudo netstat -tlnp | grep LISTEN

# Iniciar ngrok
/home/marcos/ngrok http PUERTO

# Detener ngrok
pkill ngrok

# Ver contenedores y puertos
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Panel web ngrok
firefox http://localhost:4041
```

### Rangos Libres Recomendados

```
3001-3006   → Apps Node.js/Express
8091-8099   → Apps Web
9001-9999   → Proxies/Gateways
10000+      → Proyectos temporales
```

---

## 📖 RECURSOS ADICIONALES

### Documentación Oficial

- **ngrok:** https://ngrok.com/docs
- **Docker Networking:** https://docs.docker.com/network/
- **nginx Proxy:** https://nginx.org/en/docs/

### Archivos Relacionados del Proyecto

- `docker-compose.yml` - Configuración de contenedores y puertos
- `nginx-proxy-unified.conf` - Configuración del proxy ngrok
- `iniciar-ngrok.sh` - Script de inicio automático
- `FIX_AUTO_LOGIN_LOCAL.md` - Configuración local vs ngrok
- `SISTEMA_COMPLETO_FINAL_NGROK.md` - Arquitectura completa

### Contacto y Soporte

Para problemas con puertos o ngrok:
1. Revisar esta documentación
2. Verificar logs: `tail -f ngrok.log`
3. Consultar panel web: http://localhost:4041
4. Revisar estado de servicios: `docker ps`

---

## 📝 HISTORIAL DE CAMBIOS

| Fecha | Cambio | Puertos Afectados |
|-------|--------|-------------------|
| 21-Oct-2025 | Fix auto-login local | 8080, 80 |
| 21-Oct-2025 | Documentación puertos y ngrok | Todos |
| 15-Oct-2025 | Configuración ngrok unificado | 9000 |
| 11-Oct-2025 | Primera configuración ngrok | 8088 |

---

**Última actualización:** 21 de Octubre 2025
**Versión:** 1.0
**Autor:** Sistema Biblioteca Digital HENM
**Estado:** ✅ Documentación Completa
