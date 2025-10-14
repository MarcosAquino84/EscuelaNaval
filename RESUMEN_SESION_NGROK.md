# 📋 RESUMEN DE LA SESIÓN - CONFIGURACIÓN NGROK

**Fecha:** 14 de Octubre 2025
**Objetivo:** Configurar el sistema completo de biblioteca digital para funcionar a través de ngrok
**Estado Final:** ✅ COMPLETADO Y FUNCIONAL

---

## 🎯 PROBLEMA INICIAL

El sistema tenía múltiples servicios (DSpace, Koha, Admin Panel) funcionando localmente pero necesitaba ser accesible desde Internet usando ngrok (plan gratuito con 1 solo dominio).

**Desafíos:**
- DSpace mostraba "Invalid Host Header"
- Error 500 / Service Unavailable en DSpace
- URLs absolutas con IPs locales no accesibles desde Internet
- CSRF token errors en el backend de DSpace

---

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. **Login Page - Gestión de Citas**
Se agregó el badge de "Gestión de Citas" al panel de login para mostrar los tres servicios principales:
- Koha (Catálogo)
- DSpace (Repositorio)
- Gestión de Citas (nuevo)

**Archivo:** `admin-panel/index.html`

---

### 2. **Configuración de ngrok**
Se configuró ngrok con el flag correcto para bypass del webpack-dev-server:

```bash
/home/marcos/ngrok http 9000 --host-header=rewrite
```

**Por qué:** El flag `--host-header=rewrite` es esencial para que webpack-dev-server de Angular acepte peticiones desde el dominio de ngrok.

---

### 3. **Configuración de DSpace Angular**

#### Problema:
El `config.json` generaba URLs con IPs locales que no eran accesibles desde Internet:
```json
"baseUrl": "http://172.27.72.64:8090/server" ❌
```

#### Solución:
Se configuraron variables de entorno en `docker-compose.yml` para usar el hostname de ngrok:

```yaml
DSPACE_UI_NAMESPACE: '/dspace'
DSPACE_REST_SSL: 'true'
DSPACE_REST_HOST: 'bolshevistically-prototypal-dorris.ngrok-free.dev'
DSPACE_REST_PORT: '443'
DSPACE_REST_NAMESPACE: '/server'
```

**Resultado:**
```json
"baseUrl": "https://bolshevistically-prototypal-dorris.ngrok-free.dev/server" ✅
```

**Archivo:** `docker-compose.yml` (líneas 103-106)

---

### 4. **Configuración de DSpace Backend**

Se actualizaron las URLs del backend para usar ngrok:

```yaml
dspace__P__server__P__url: 'https://bolshevistically-prototypal-dorris.ngrok-free.dev/server'
dspace__P__ui__P__url: 'https://bolshevistically-prototypal-dorris.ngrok-free.dev/dspace'
rest__P__cors__P__allowed__origins: 'https://bolshevistically-prototypal-dorris.ngrok-free.dev'
```

**Por qué:** El backend de DSpace retorna estas URLs en sus respuestas API. Si contienen IPs locales, el navegador no puede accederlas.

**Archivo:** `docker-compose.yml` (líneas 30-34)

---

### 5. **Headers HTTPS en Nginx Proxy**

Se configuraron headers para indicar que la conexión original es HTTPS:

```nginx
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Port 443;
proxy_set_header X-Forwarded-Host $host;
```

**Por qué:** DSpace necesita saber que la petición original era HTTPS para manejar correctamente CSRF tokens y cookies seguras.

**Archivos:**
- `nginx-proxy-unified.conf` (líneas 28-30 y 47-49)

---

### 6. **Configuración de DSpace Angular config.yml**

Se simplificó el archivo para permitir que las variables de entorno tomen precedencia:

```yaml
rest:
  ssl: false
  nameSpace: /server

ui:
  ssl: false
  host: 0.0.0.0
  port: 4000
  nameSpace: /dspace
```

**Por qué:** Al dejar solo lo esencial, las variables de entorno en docker-compose.yml pueden sobrescribir correctamente la configuración.

**Archivo:** `dspace-angular-config/config.yml`

---

## 📊 ARQUITECTURA FINAL

```
Internet
    ↓
ngrok https://bolshevistically-prototypal-dorris.ngrok-free.dev
(con --host-header=rewrite)
    ↓
localhost:9000 (nginx-proxy-unified)
    ├── / → Admin Panel + Login SSO
    ├── /dspace/ → DSpace Angular (puerto 4000)
    ├── /server/ → DSpace REST API (puerto 8090)
    ├── /koha/ → Koha OPAC (Apache puerto 8080)
    ├── /koha-staff/ → Koha Staff (Apache puerto 80)
    └── /api/ → Auth Service (puerto 3000)
```

---

## 🔧 ARCHIVOS MODIFICADOS

### Archivos Principales:

1. **admin-panel/index.html**
   - Agregado badge de "Gestión de Citas"

2. **docker-compose.yml**
   - URLs de DSpace backend actualizadas a ngrok
   - CORS configurado para ngrok
   - Variables de entorno de Angular actualizadas con hostname de ngrok

3. **nginx-proxy-unified.conf**
   - Headers HTTPS configurados (`X-Forwarded-Proto: https`)
   - Headers de puerto configurados (`X-Forwarded-Port: 443`)

4. **dspace-angular-config/config.yml**
   - Simplificado para permitir override por variables de entorno
   - Removidas configuraciones conflictivas de host/port

5. **SISTEMA_NGROK_COMPLETO.md** (NUEVO)
   - Documentación completa del sistema
   - URLs de acceso
   - Comandos útiles
   - Solución de problemas

---

## 🎯 RESULTADOS

### ✅ Servicios Funcionando:

| Servicio | URL | Estado |
|----------|-----|--------|
| Panel Admin (Login SSO) | https://bolshevistically-prototypal-dorris.ngrok-free.dev/ | ✅ Funcional |
| DSpace Repositorio | https://bolshevistically-prototypal-dorris.ngrok-free.dev/dspace/ | ✅ Funcional |
| Koha OPAC | https://bolshevistically-prototypal-dorris.ngrok-free.dev/koha/ | ✅ Funcional |
| Koha Staff | https://bolshevistically-prototypal-dorris.ngrok-free.dev/koha-staff/ | ✅ Funcional |

### ✅ Problemas Resueltos:

- ❌ "Invalid Host Header" → ✅ Resuelto con `--host-header=rewrite`
- ❌ Error 500 en DSpace → ✅ Resuelto con URLs correctas de ngrok
- ❌ URLs con IPs locales → ✅ Resuelto con configuración de hostname
- ❌ CSRF token errors → ✅ Resuelto con headers HTTPS

---

## 📝 LECCIONES APRENDIDAS

### 1. **webpack-dev-server y ngrok**
El servidor de desarrollo de Angular rechaza peticiones de hosts no conocidos. La solución es doble:
- Flag `--host-header=rewrite` en ngrok
- Flag `--disable-host-check` en webpack-dev-server

### 2. **URLs Relativas vs Absolutas**
Intentar usar URLs relativas (`host: ''`) generó URLs malformadas (`http:///server`). La solución fue usar el hostname completo de ngrok.

### 3. **Configuración por Capas**
DSpace lee configuración de múltiples fuentes:
1. `config.yml` (archivo)
2. Variables de entorno (docker-compose.yml)
3. Valores por defecto

Las variables de entorno tienen prioridad, pero solo si el archivo no especifica un valor conflictivo.

### 4. **Headers de Proxy**
Para que aplicaciones detecten correctamente HTTPS detrás de un proxy:
```nginx
X-Forwarded-Proto: https
X-Forwarded-Port: 443
X-Forwarded-Host: <hostname>
```

### 5. **Caché del Navegador**
Los cambios en `config.json` se cachean agresivamente. Siempre probar con:
- Modo incógnito, O
- Limpiar caché completamente

---

## 🚀 COMANDO PARA INICIAR

```bash
# Iniciar ngrok
/home/marcos/ngrok http 9000 --host-header=rewrite

# URL resultante:
# https://bolshevistically-prototypal-dorris.ngrok-free.dev
```

**Nota:** Si la URL de ngrok cambia, actualizar:
1. `docker-compose.yml` (líneas 30-31 y 104-105)
2. Reiniciar: `docker-compose up -d`

---

## 📚 DOCUMENTACIÓN CREADA

1. **SISTEMA_NGROK_COMPLETO.md**
   - Guía completa del sistema
   - URLs de acceso
   - Arquitectura
   - Solución de problemas

2. **RESUMEN_SESION_NGROK.md** (este archivo)
   - Resumen de cambios
   - Problemas resueltos
   - Lecciones aprendidas

---

## 🎉 CONCLUSIÓN

El sistema de biblioteca digital está completamente funcional y accesible desde Internet a través de ngrok. Todos los servicios (DSpace, Koha OPAC, Koha Staff, Panel Admin) funcionan correctamente con:

- ✅ Single Sign-On (SSO)
- ✅ Diseño institucional HENM
- ✅ Interfaz en español
- ✅ HTTPS automático vía ngrok
- ✅ URLs correctas en todas las respuestas
- ✅ CSRF y CORS configurados

**El sistema está listo para ser usado por estudiantes y personal de la institución desde cualquier lugar con acceso a Internet.**

---

**Desarrollado para:** Heroica Escuela Naval Militar (HENM)
**Tecnologías:** DSpace 7.x, Koha, Node.js, Docker, nginx, ngrok
**Fecha:** Octubre 2025
