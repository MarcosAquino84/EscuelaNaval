# Versión Funcional - Sistema SSO con Auto-Login Koha/DSpace

**Fecha:** 29 de Octubre 2025
**Estado:** ✅ COMPLETAMENTE FUNCIONAL
**Versión:** 2.0 - Persistencia de Sesión Corregida

---

## 🎯 Resumen Ejecutivo

Sistema de Single Sign-On (SSO) completamente funcional para la Biblioteca Digital de la Heroica Escuela Naval Militar (HENM) que integra:
- Panel de administración centralizado
- DSpace (repositorio digital institucional)
- Koha (sistema de gestión bibliotecaria)

**Problema resuelto:** Persistencia de sesión en Koha al acceder mediante auto-login centralizado a través de ngrok.

---

## 🌐 URLs de Acceso

### URL Pública (ngrok)
```
https://bolshevistically-prototypal-dorris.ngrok-free.dev
```

### Servicios Disponibles

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Panel Principal** | `https://bolshevistically-prototypal-dorris.ngrok-free.dev/` | Login unificado y dashboard |
| **DSpace** | `https://bolshevistically-prototypal-dorris.ngrok-free.dev/dspace/` | Repositorio digital institucional |
| **Koha OPAC** | `https://bolshevistically-prototypal-dorris.ngrok-free.dev/koha/` | Catálogo público de biblioteca |
| **Koha Staff** | `https://bolshevistically-prototypal-dorris.ngrok-free.dev/koha-staff/` | Interfaz administrativa de Koha |
| **Auth API** | `https://bolshevistically-prototypal-dorris.ngrok-free.dev/api/` | API de autenticación |

### URLs Locales (Desarrollo)

| Servicio | Puerto | URL Local |
|----------|--------|-----------|
| Panel Principal | 8088 | http://172.27.72.64:8088 |
| Auth Service | 3000 | http://172.27.72.64:3000 |
| DSpace UI | 4000 | http://172.27.72.64:4000 |
| DSpace API | 8090 | http://172.27.72.64:8090 |
| Koha OPAC | 8080 | http://172.27.72.64:8080 |
| Koha Staff | 80 | http://172.27.72.64/ |
| Proxy Unificado | 9000 | http://localhost:9000 |
| ngrok Dashboard | 4040 | http://localhost:4040 |

---

## 🔐 Credenciales de Acceso

### Usuarios del Sistema

#### Administrador Principal
```
Email: admin@biblioteca.local
Password: admin123
Koha UserID: admin
Roles: Todos los sistemas
```

#### Usuario Marcos (Biblioteca)
```
Email: marcos@biblioteca.local
Password: marcos123
Koha UserID: mbiblioteca
Roles: Administrador de biblioteca
```

#### Usuario Alumno
```
Email: alumno@biblioteca.local
Password: alumno123
Koha UserID: abiblioteca
Roles: Estudiante
```

#### Usuario María García
```
Email: maria.garcia@estudiante.local
Password: maria123
Koha UserID: mgarcia
Roles: Estudiante
```

#### Psicólogo Martínez
```
Email: psic.martinez@henm.edu.mx
Password: psic123
Koha UserID: pmartinez
Roles: Psicólogo orientador
```

#### Psicólogo López
```
Email: psic.lopez@henm.edu.mx
Password: psic456
Koha UserID: plopez
Roles: Psicólogo orientador
```

---

## 🛠️ Arquitectura del Sistema

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIO FINAL                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   NGROK (Túnel)                          │
│     https://bolshevistically-prototypal-dorris...       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Nginx Proxy Unificado (9000)                  │
│  Enrutamiento: /dspace, /koha, /koha-staff, /api, /     │
└─────┬──────────┬──────────┬──────────┬──────────┬───────┘
      │          │          │          │          │
      ▼          ▼          ▼          ▼          ▼
  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
  │DSpace  │ │Koha    │ │Koha    │ │Auth    │ │Admin   │
  │Angular │ │OPAC    │ │Staff   │ │Service │ │Panel   │
  │:4000   │ │:8080   │ │:80     │ │:3000   │ │:8088   │
  └───┬────┘ └────────┘ └────────┘ └───┬────┘ └────────┘
      │                                 │
      ▼                                 ▼
  ┌────────┐                     ┌──────────────┐
  │DSpace  │                     │PostgreSQL    │
  │Backend │                     │Auth DB       │
  │:8090   │                     │:5433         │
  └───┬────┘                     └──────────────┘
      │
      ▼
  ┌────────┐
  │Postgres│
  │:5433   │
  └────────┘
```

### Componentes Docker

```yaml
Contenedores Activos:
✅ dspace              - Backend de DSpace (Java/Tomcat)
✅ dspace-angular      - Frontend de DSpace (Angular)
✅ dspacedb            - PostgreSQL para DSpace
✅ dspacesolr          - Solr para búsquedas
✅ auth-service        - API de autenticación (Node.js)
✅ koha-mariadb        - MariaDB para Koha
✅ koha-memcached      - Caché para Koha
✅ koha-web            - Servidor web para archivos estáticos
✅ koha-api            - API proxy
✅ admin-panel         - Panel web (Nginx)
✅ ngrok-proxy         - Proxy unificado (Nginx)
```

### Servicios Nativos (Ubuntu)

```
✅ koha-common         - Servicios de Koha
✅ apache2             - Apache con módulos Koha
✅ zebra               - Indexador de Koha
✅ workers             - Workers de tareas en segundo plano
```

---

## 🔧 Solución al Problema de Persistencia de Sesión

### Problema Identificado

Al acceder a Koha (OPAC y Staff) mediante auto-login centralizado desde el panel de administración:
1. ❌ El formulario POST enviaba credenciales correctamente
2. ❌ Koha generaba la cookie CGISESSID
3. ❌ La sesión NO persistía - volvía a pedir credenciales
4. ❌ Mensaje: "Su sesión ha expirado"

### Causa Raíz

**Dos problemas combinados:**

1. **URLs Hardcodeadas**: Los archivos de auto-login usaban `http://172.27.72.64/...` que no funcionaban cuando se accedía mediante ngrok

2. **Reescritura de Cookies por Nginx**: El proxy estaba modificando las cookies de Koha:
   ```nginx
   # INCORRECTO (causaba el problema)
   proxy_cookie_path / /koha/;
   proxy_cookie_path / /koha-staff/;
   ```

   Esto hacía que:
   - Cookie original de Koha: `CGISESSID=xxx; path=/`
   - Cookie modificada: `CGISESSID=xxx; path=/koha/`
   - Koha buscaba la cookie en `/` pero el navegador solo la enviaba para `/koha/`
   - Resultado: Koha no encontraba la sesión

### Solución Implementada

#### 1. Nuevo Archivo: koha-staff-auto-login.html

**Ubicación:** `/admin-panel/koha-staff-auto-login.html`

**Características:**
- ✅ Usa `window.location.origin` para detectar automáticamente el dominio
- ✅ Funciona tanto en local (`http://172.27.72.64`) como en ngrok (`https://...ngrok-free.dev`)
- ✅ Construye URLs relativas: `window.location.origin + '/koha-staff/cgi-bin/koha/mainpage.pl'`
- ✅ Mapeo automático de emails a userids de Koha
- ✅ Interfaz institucional con branding HENM

**Flujo:**
```javascript
1. Lee credenciales de sessionStorage
2. Mapea email → userid de Koha
3. Detecta dominio actual (local o ngrok)
4. Construye URL: origin + '/koha-staff/cgi-bin/koha/mainpage.pl'
5. Crea formulario POST con:
   - op: cud-login
   - koha_login_context: intranet
   - login_userid: [userid mapeado]
   - login_password: [password del usuario]
6. Envía formulario → Koha autentica → Establece CGISESSID
```

#### 2. Actualizado: koha-opac-auto-login.html

**Cambios:**
```javascript
// ANTES (hardcodeado)
const isNgrok = window.location.hostname.includes('ngrok');
const opacBaseUrl = isNgrok
    ? window.location.origin + '/koha'
    : 'http://172.27.72.64:8080';

// DESPUÉS (siempre relativo)
const opacBaseUrl = window.location.origin + '/koha';
```

**Beneficios:**
- ✅ Funciona en cualquier dominio
- ✅ No requiere configuración manual
- ✅ Más simple y mantenible

#### 3. Configuración Nginx Corregida

**Archivo:** `/nginx-proxy-unified.conf`

**Cambios en /koha/ (OPAC):**
```nginx
location /koha/ {
    proxy_pass http://172.17.0.1:8080/;

    # ELIMINADO - Esto causaba el problema
    # proxy_cookie_path / /koha/;

    # Koha maneja sus propias cookies correctamente
    proxy_redirect / /koha/;
    # ... resto de configuración
}
```

**Cambios en /koha-staff/ (Staff):**
```nginx
location /koha-staff/ {
    proxy_pass http://172.17.0.1:80/;

    # ELIMINADO - Esto causaba el problema
    # proxy_cookie_path / /koha-staff/;
    # proxy_cookie_domain localhost $host;

    # Koha maneja sus propias cookies correctamente
    proxy_redirect / /koha-staff/;
    # ... resto de configuración
}
```

**Por qué funciona ahora:**
- Cookie de Koha: `CGISESSID=abc123; path=/; HttpOnly; SameSite=Lax`
- Nginx NO la modifica, la deja pasar tal cual
- El navegador la guarda con `path=/`
- En requests subsecuentes a `/koha/...` o `/koha-staff/...`, el navegador envía la cookie
- Koha la encuentra y mantiene la sesión ✅

#### 4. Dashboard Actualizado

**Archivo:** `/admin-panel/dashboard.html`

**Cambio en configuración de sistemas:**
```javascript
// ANTES
koha_staff: {
    nombre: 'Koha - Staff Interface',
    descripcion: 'Sistema de Gestión Bibliotecaria (Login: admin/admin123)',
    url: 'http://localhost:8080/',
    useAutoLogin: false,  // ❌ Sin auto-login
    // ...
}

// DESPUÉS
koha_staff: {
    nombre: 'Koha - Staff Interface',
    descripcion: 'Sistema de Gestión Bibliotecaria',
    url: 'koha-staff-auto-login.html',
    useAutoLogin: true,  // ✅ Con auto-login
    // ...
}
```

---

## 📝 Mapeo de Usuarios Email → Koha UserID

El sistema mantiene un mapeo centralizado de emails a userids de Koha:

```javascript
const kohaUserMap = {
    'admin@biblioteca.local': 'admin',
    'marcos@biblioteca.local': 'mbiblioteca',
    'alumno@biblioteca.local': 'abiblioteca',
    'maria.garcia@estudiante.local': 'mgarcia',
    'psic.martinez@henm.edu.mx': 'pmartinez',
    'psic.lopez@henm.edu.mx': 'plopez'
};
```

**Ubicación del mapeo:**
- `/admin-panel/koha-staff-auto-login.html` (líneas 247-254)
- `/admin-panel/koha-opac-auto-login.html` (líneas 246-253)

**Fallback:** Si el email no está en el mapeo, se usa la parte antes del `@`:
```javascript
const kohaUserid = kohaUserMap[usuario.email] || usuario.email.split('@')[0];
```

---

## 🚀 Flujo Completo de Auto-Login

### Usuario Final: Inicio de Sesión

```
1. Usuario accede: https://...ngrok-free.dev/
   ↓
2. Panel de login se carga (index.html → redirige a login.html)
   ↓
3. Usuario ingresa:
   - Email: admin@biblioteca.local
   - Password: admin123
   ↓
4. Click en "Iniciar Sesión"
   ↓
5. JavaScript hace POST a /api/login
   ↓
6. Auth Service:
   - Valida credenciales en PostgreSQL
   - Genera sesión
   - Intenta obtener token de Koha (si aplica)
   - Retorna: {success: true, usuario: {...}}
   ↓
7. Panel guarda en sessionStorage:
   sessionStorage.setItem('usuario', JSON.stringify({
       email: 'admin@biblioteca.local',
       password: 'admin123',  // Temporal para auto-login
       nombreCompleto: 'Admin Koha',
       tipo: 'administrador',
       // ...
   }))
   ↓
8. Redirige a dashboard.html
```

### Auto-Login en Koha OPAC

```
1. Usuario en dashboard ve tarjeta "Koha - Catálogo Público"
   ↓
2. Click en tarjeta → accederSistema('koha_opac')
   ↓
3. Dashboard abre nueva ventana: koha-opac-auto-login.html
   ↓
4. koha-opac-auto-login.html:
   a) Lee sessionStorage.getItem('usuario')
   b) Extrae email y password
   c) Mapea email → kohaUserid
      'admin@biblioteca.local' → 'admin'
   d) Detecta dominio: window.location.origin
      Resultado: 'https://...ngrok-free.dev'
   e) Construye URL:
      origin + '/koha/cgi-bin/koha/opac-user.pl'
   f) Crea formulario POST:
      - action: URL construida
      - koha_login_context: 'opac'
      - op: 'cud-login'
      - login_userid: 'admin'
      - login_password: 'admin123'
   g) Envía formulario automáticamente
   ↓
5. Formulario POST llega a ngrok-proxy:
   https://...ngrok-free.dev/koha/cgi-bin/koha/opac-user.pl
   ↓
6. Nginx proxy redirige a:
   http://172.17.0.1:8080/cgi-bin/koha/opac-user.pl
   ↓
7. Koha OPAC recibe POST:
   - Valida credenciales en MariaDB
   - Genera sesión en tabla 'sessions'
   - Establece cookie: CGISESSID=xyz789; path=/
   ↓
8. Nginx NO modifica la cookie (problema resuelto)
   ↓
9. Cookie llega al navegador tal cual:
   CGISESSID=xyz789; path=/; domain=.ngrok-free.dev
   ↓
10. Koha redirige a página de usuario autenticado
    ↓
11. ✅ Usuario está autenticado en OPAC
```

### Auto-Login en Koha Staff

```
1. Usuario en dashboard ve tarjeta "Koha - Staff Interface"
   ↓
2. Click en tarjeta → accederSistema('koha_staff')
   ↓
3. Dashboard abre nueva ventana: koha-staff-auto-login.html
   ↓
4. koha-staff-auto-login.html:
   a) Lee sessionStorage.getItem('usuario')
   b) Extrae email y password
   c) Mapea email → kohaUserid
   d) Detecta dominio: window.location.origin
   e) Construye URL:
      origin + '/koha-staff/cgi-bin/koha/mainpage.pl'
   f) Crea formulario POST:
      - action: URL construida
      - koha_login_context: 'intranet'  ← DIFERENTE de OPAC
      - op: 'cud-login'
      - login_userid: 'admin'
      - login_password: 'admin123'
   g) Envía formulario automáticamente
   ↓
5. Formulario POST llega a:
   https://...ngrok-free.dev/koha-staff/cgi-bin/koha/mainpage.pl
   ↓
6. Nginx proxy redirige a:
   http://172.17.0.1:80/cgi-bin/koha/mainpage.pl
   ↓
7. Koha Staff recibe POST:
   - Valida credenciales y permisos
   - Genera sesión
   - Establece cookie: CGISESSID=abc456; path=/
   ↓
8. Nginx NO modifica la cookie
   ↓
9. Cookie llega al navegador:
   CGISESSID=abc456; path=/
   ↓
10. Koha redirige a interfaz staff
    ↓
11. ✅ Usuario está autenticado en Staff
```

### Persistencia de Sesión

```
Usuario navega en Koha (ejemplo: buscar un libro)
   ↓
Navegador hace GET:
   https://...ngrok-free.dev/koha/cgi-bin/koha/opac-search.pl?q=naval
   ↓
Headers incluyen automáticamente:
   Cookie: CGISESSID=xyz789
   ↓
Nginx proxy pasa request a Koha:
   http://172.17.0.1:8080/cgi-bin/koha/opac-search.pl?q=naval
   Cookie: CGISESSID=xyz789  ← Cookie incluida
   ↓
Koha busca sesión en base de datos:
   SELECT * FROM sessions WHERE id = 'xyz789'
   ↓
✅ Sesión encontrada → Usuario autenticado
   ↓
Koha retorna resultados de búsqueda
   ↓
Usuario continúa navegando SIN volver a pedir login
```

---

## 📂 Archivos Modificados/Creados

### Archivos Nuevos

1. **`/admin-panel/koha-staff-auto-login.html`**
   - Auto-login para Koha Staff Interface
   - Usa URLs relativas con `window.location.origin`
   - Interfaz institucional con branding HENM
   - Mapeo de usuarios integrado

### Archivos Modificados

1. **`/admin-panel/koha-opac-auto-login.html`**
   - Simplificada detección de entorno
   - Siempre usa URLs relativas
   - Mejorada experiencia de usuario

2. **`/admin-panel/dashboard.html`**
   - Koha Staff ahora usa auto-login
   - URL actualizada a `koha-staff-auto-login.html`
   - Bandera `useAutoLogin: true`

3. **`/nginx-proxy-unified.conf`**
   - Eliminada reescritura de cookies en `/koha/`
   - Eliminada reescritura de cookies en `/koha-staff/`
   - Comentarios explicativos agregados
   - Soluciona problema de persistencia

### Archivos de Configuración Base

4. **`/docker-compose.yml`**
   - Configuración de todos los servicios
   - Networks, volumes, puertos

5. **`/iniciar-ngrok.sh`**
   - Script de inicio de ngrok
   - Validaciones y configuración automática

6. **`/.env`**
   - Variables de entorno
   - Credenciales de bases de datos

---

## 🔍 Troubleshooting

### Problema: Sesión No Persiste

**Síntomas:**
- Auto-login funciona inicialmente
- Al navegar, Koha vuelve a pedir login
- Mensaje: "Su sesión ha expirado"

**Diagnóstico:**
```javascript
// En consola del navegador (F12 → Console)
document.cookie
// Verificar si CGISESSID tiene path=/
```

**Solución:**
1. Verificar que nginx-proxy-unified.conf NO tenga:
   ```nginx
   proxy_cookie_path / /koha/;
   ```
2. Reiniciar ngrok-proxy:
   ```bash
   docker restart ngrok-proxy
   ```

### Problema: URL Incorrecta

**Síntomas:**
- Auto-login redirige a 404
- URLs apuntan a localhost en producción

**Solución:**
- Verificar que auto-login use `window.location.origin`
- NO debe tener URLs hardcodeadas como `http://172.27.72.64`

### Problema: Credentials No Coinciden

**Síntomas:**
- "Credenciales inválidas"
- Usuario no existe en Koha

**Diagnóstico:**
1. Verificar mapeo de usuarios:
   ```javascript
   const kohaUserMap = {
       'admin@biblioteca.local': 'admin',  // ← Verificar
       // ...
   };
   ```

2. Verificar usuario en Koha:
   ```sql
   SELECT userid, cardnumber FROM borrowers WHERE userid = 'admin';
   ```

**Solución:**
- Actualizar mapeo en archivos de auto-login
- O crear usuario en Koha con userid esperado

### Problema: ngrok No Inicia

**Síntomas:**
- Error: "ngrok not found"
- Error: "not authenticated"

**Solución:**
```bash
# Instalar ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Autenticar
ngrok config add-authtoken TU_TOKEN_AQUI
```

### Problema: Proxy Unificado No Responde

**Síntomas:**
- Error 502 Bad Gateway
- ngrok muestra error de upstream

**Diagnóstico:**
```bash
docker logs ngrok-proxy
docker ps | grep ngrok-proxy
curl http://localhost:9000/
```

**Solución:**
```bash
# Verificar que dspace-angular esté corriendo
docker ps | grep dspace-angular

# Reiniciar proxy
docker restart ngrok-proxy
```

### Limpieza de Cookies (Si es Necesario)

```javascript
// En consola del navegador
document.cookie.split(";").forEach(function(c) {
    document.cookie = c.replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

---

## 🧪 Testing y Validación

### Test 1: Login en Panel

```bash
curl -X POST https://bolshevistically-prototypal-dorris.ngrok-free.dev/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@biblioteca.local","password":"admin123"}'
```

**Resultado esperado:**
```json
{
  "success": true,
  "usuario": {
    "email": "admin@biblioteca.local",
    "nombreCompleto": "Admin Koha",
    "tipo": "administrador"
  }
}
```

### Test 2: Auto-Login Koha Staff

1. Acceder: `https://...ngrok-free.dev/`
2. Login: `admin@biblioteca.local` / `admin123`
3. Click en "Koha - Staff Interface"
4. **Verificar:**
   - ✅ Abre nueva ventana con loading
   - ✅ Redirige automáticamente a Koha Staff
   - ✅ Muestra interfaz autenticada (no formulario de login)
   - ✅ Nombre de usuario visible en esquina superior

### Test 3: Persistencia de Sesión Staff

1. Después del auto-login exitoso
2. Navegar a: Catálogo → Búsqueda
3. Hacer una búsqueda
4. **Verificar:**
   - ✅ NO pide login nuevamente
   - ✅ Sesión se mantiene
   - ✅ Cookie CGISESSID presente

### Test 4: Auto-Login Koha OPAC

1. En dashboard, click en "Koha - Catálogo Público"
2. **Verificar:**
   - ✅ Abre OPAC autenticado
   - ✅ Nombre de usuario visible
   - ✅ Acceso a "Mi cuenta"

### Test 5: Persistencia de Sesión OPAC

1. Después del auto-login
2. Navegar: Búsqueda avanzada → Mi cuenta
3. **Verificar:**
   - ✅ Sesión persiste
   - ✅ No pide login

### Test 6: Cookies Correctas

```javascript
// En consola del navegador después de auto-login
document.cookie
// Buscar: CGISESSID=...; path=/
// NO debe tener: path=/koha/ o path=/koha-staff/
```

---

## 📊 Monitoreo y Logs

### ngrok Dashboard
```
URL: http://localhost:4040
- Ver todas las peticiones HTTP
- Inspeccionar headers y payloads
- Revisar tiempos de respuesta
```

### Logs de Servicios

```bash
# ngrok
tail -f ngrok.log

# Proxy unificado
docker logs -f ngrok-proxy

# DSpace
docker logs -f dspace
docker logs -f dspace-angular

# Auth Service
docker logs -f auth-service

# Apache (Koha)
sudo tail -f /var/log/apache2/error.log
sudo tail -f /var/log/apache2/access.log

# Koha
sudo tail -f /var/log/koha/biblioteca/zebra-error.log
```

### Verificar Estado de Servicios

```bash
# Docker
docker ps

# Koha nativo
systemctl status koha-common
systemctl status apache2

# ngrok
pgrep ngrok
curl http://localhost:4040/api/tunnels | jq '.tunnels[0].public_url'

# Proxy unificado
curl -s http://localhost:9000/ > /dev/null && echo "OK" || echo "FAIL"
```

---

## 🚀 Comandos de Administración

### Iniciar Todo el Sistema

```bash
# 1. Iniciar servicios Docker
docker-compose up -d

# 2. Esperar a que DSpace inicie (2-3 minutos)
watch -n 5 'docker logs dspace --tail 5'
# Esperar mensaje: "Server startup in XXX milliseconds"

# 3. Iniciar ngrok
./iniciar-ngrok.sh

# 4. Verificar estado
docker ps
curl http://localhost:9000/
```

### Detener Todo el Sistema

```bash
# 1. Detener ngrok
pkill ngrok

# 2. Detener Docker
docker-compose down

# Nota: Koha nativo sigue corriendo (systemd)
```

### Reiniciar Solo el Proxy

```bash
docker restart ngrok-proxy
# Esperar 5 segundos
curl http://localhost:9000/
```

### Reiniciar ngrok (Nueva URL)

```bash
# Matar proceso actual
pkill ngrok

# Iniciar nuevamente
./iniciar-ngrok.sh

# IMPORTANTE: La URL cambiará
# Ver nueva URL en la salida del script
```

### Limpiar y Reiniciar Completamente

```bash
# 1. Detener todo
pkill ngrok
docker-compose down

# 2. Opcional: Limpiar volúmenes (CUIDADO: Borra datos)
# docker-compose down -v

# 3. Reiniciar
docker-compose up -d
sleep 120  # Esperar 2 minutos
./iniciar-ngrok.sh
```

---

## 🔒 Seguridad

### Consideraciones Actuales (Desarrollo)

⚠️ **NO USAR EN PRODUCCIÓN TAL CUAL:**

1. **Password en sessionStorage**
   - Vulnerable a XSS
   - Solo para desarrollo
   - En producción: Usar tokens JWT

2. **HTTP en servicios internos**
   - Comunicación sin cifrar entre contenedores
   - Aceptable en red privada
   - En producción: Usar HTTPS

3. **Credenciales en código**
   - Mapeo de usuarios visible en JS
   - En producción: Mover a backend

### Mejoras para Producción

1. **Implementar OAuth2/OpenID Connect**
   ```
   Keycloak o Auth0 como IdP
   DSpace y Koha como Service Providers
   ```

2. **Usar Tokens en Lugar de Passwords**
   ```javascript
   // Generar token temporal (5 min)
   const tempToken = jwt.sign(
       { userid: 'admin', exp: Date.now() + 300000 },
       SECRET_KEY
   );

   // Auto-login usa token, no password
   ```

3. **HTTPS Obligatorio**
   ```nginx
   # Redirigir HTTP → HTTPS
   if ($scheme != "https") {
       return 301 https://$host$request_uri;
   }
   ```

4. **Cookies Seguras**
   ```nginx
   proxy_cookie_flags ~ secure httponly samesite=strict;
   ```

5. **Rate Limiting**
   ```nginx
   limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
   location /api/login {
       limit_req zone=login burst=3;
   }
   ```

---

## 📈 Próximos Pasos / Roadmap

### Corto Plazo (1-2 semanas)

- [ ] Implementar logout sincronizado en Koha
- [ ] Agregar manejo de errores mejorado en auto-login
- [ ] Crear tests automatizados
- [ ] Documentar API de auth-service
- [ ] Agregar logs de auditoría

### Mediano Plazo (1-2 meses)

- [ ] Migrar a tokens JWT
- [ ] Implementar refresh tokens
- [ ] Configurar HTTPS con Let's Encrypt
- [ ] Implementar 2FA (autenticación de dos factores)
- [ ] Dashboard de administración mejorado

### Largo Plazo (3-6 meses)

- [ ] Migrar a Keycloak para SSO enterprise
- [ ] Implementar SAML para integración institucional
- [ ] Agregar integración con LDAP/Active Directory
- [ ] Sistema de reportes y analytics
- [ ] App móvil para estudiantes

---

## 📚 Recursos y Referencias

### Documentación Oficial

- [DSpace 7 Documentation](https://wiki.lyrasis.org/display/DSDOC7x)
- [Koha Manual](https://koha-community.org/manual/)
- [ngrok Documentation](https://ngrok.com/docs)
- [Nginx Proxy Guide](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)

### Documentación del Proyecto

- `SISTEMA_SSO.md` - Arquitectura completa del SSO
- `LIMITACIONES_AUTO_LOGIN.md` - Explicación técnica de limitaciones
- `SOLUCION_AUTO_LOGIN_FINAL.md` - Solución anterior implementada
- `GUIA_DESARROLLO.md` - Guía para desarrolladores

### Stack Overflow / Foros

- [Koha Community](https://koha-community.org/)
- [DSpace Community](https://dspace.lyrasis.org/community/)
- [Nginx Forum](https://forum.nginx.org/)

---

## 🎓 Glosario

- **SSO (Single Sign-On):** Sistema que permite a los usuarios autenticarse una vez y acceder a múltiples aplicaciones
- **CGISESSID:** Cookie de sesión de Koha
- **Auto-login:** Proceso automatizado de inicio de sesión sin intervención manual del usuario
- **Proxy reverso:** Servidor que redirige peticiones de clientes a servidores backend
- **ngrok:** Servicio de túneles que expone servidores locales a internet
- **sessionStorage:** Almacenamiento de datos en el navegador que persiste durante la sesión
- **OPAC (Online Public Access Catalog):** Catálogo público de biblioteca accesible en línea
- **Staff Interface:** Interfaz administrativa de Koha para bibliotecarios

---

## ✅ Checklist de Validación

### Sistema Levantado Correctamente

- [x] Docker containers corriendo
- [x] Koha nativo activo (Apache + servicios)
- [x] ngrok túnel activo
- [x] Proxy unificado respondiendo en puerto 9000
- [x] Panel principal accesible vía ngrok
- [x] DSpace accesible vía ngrok
- [x] Koha OPAC accesible vía ngrok
- [x] Koha Staff accesible vía ngrok

### Auto-Login Funcional

- [x] Login en panel principal funciona
- [x] Dashboard muestra sistemas disponibles
- [x] Click en Koha OPAC abre auto-login
- [x] Auto-login OPAC autentica correctamente
- [x] Click en Koha Staff abre auto-login
- [x] Auto-login Staff autentica correctamente

### Persistencia de Sesión

- [x] Sesión OPAC persiste al navegar
- [x] Sesión Staff persiste al navegar
- [x] Cookies establecidas con path=/
- [x] Sin reescritura de cookies en nginx
- [x] No pide credenciales múltiples veces

### Configuración

- [x] URLs relativas en auto-login
- [x] window.location.origin usado correctamente
- [x] Mapeo de usuarios actualizado
- [x] nginx-proxy-unified.conf sin proxy_cookie_path
- [x] Dashboard apunta a archivos correctos

---

## 📞 Soporte

Para problemas o preguntas:

1. **Revisar logs:** Sección "Monitoreo y Logs"
2. **Consultar Troubleshooting:** Sección de diagnóstico
3. **Verificar checklist:** Validar todos los items
4. **Documentar el error:**
   - Logs relevantes
   - Pasos para reproducir
   - Resultado esperado vs obtenido

---

## 📝 Historial de Cambios

### Versión 2.0 - 29 Oct 2025
- ✅ Resuelto problema de persistencia de sesión en Koha
- ✅ Creado koha-staff-auto-login.html con URLs relativas
- ✅ Actualizado koha-opac-auto-login.html
- ✅ Eliminada reescritura de cookies en nginx
- ✅ Dashboard configurado para auto-login en ambos interfaces
- ✅ Sistema completamente funcional con ngrok

### Versión 1.0 - 9 Oct 2025
- ✅ Implementación inicial de SSO
- ✅ Auto-login de DSpace funcional
- ⚠️ Auto-login de Koha con problemas de persistencia

---

**Versión del Documento:** 2.0
**Última Actualización:** 29 de Octubre 2025
**Estado:** ✅ Versión Funcional Completa
**Autor:** Sistema SSO HENM
