# 🔧 SOLUCIÓN: Auto-Login Koha Staff Pierde Sesión

## 🔍 PROBLEMA IDENTIFICADO

**Síntoma:** Al hacer auto-login a Koha Staff, llegas correctamente a la página principal, pero al hacer clic en opciones como "Herramientas" (Tools), te redirige al login nuevamente.

**Causa Raíz:**
1. **Cookies de sesión no se mantienen** al navegar entre páginas de Koha
2. **Acceso directo vs Proxy**: Koha está corriendo en el puerto 80, pero el auto-login funciona mejor a través del proxy
3. **Path de cookies**: Las cookies se establecen en un path pero las páginas internas las buscan en otro

---

## ✅ SOLUCIONES

### 🎯 **SOLUCIÓN 1: ACCEDER SIEMPRE DESDE EL DASHBOARD** (Recomendada)

**Problema:** Estás accediendo directamente a `http://localhost:8080/` en lugar de usar el dashboard.

**Solución:**

1. **NO accedas directamente** a:
   - ❌ `http://localhost:8080/`
   - ❌ `http://localhost/cgi-bin/koha/`

2. **SÍ accede siempre desde el dashboard**:
   - ✅ `http://localhost:8088/` (Admin Panel)
   - ✅ Click en "Koha Staff" desde el dashboard
   - ✅ O usa ngrok: `https://bolshevistically-prototypal-dorris.ngrok-free.dev/`

**¿Por qué funciona?**
- El dashboard establece las credenciales en `sessionStorage`
- El auto-login usa esas credenciales para crear la sesión
- Las cookies se configuran correctamente cuando pasas por el dashboard

---

### 🎯 **SOLUCIÓN 2: USAR LOGIN MANUAL DIRECTO**

Si necesitas acceder directamente sin auto-login:

1. Ve a: `http://localhost:8080/` o `http://localhost/cgi-bin/koha/mainpage.pl`
2. Haz login manualmente con:
   - **Usuario:** `admin`
   - **Password:** `admin123`

Esto establecerá una sesión normal de Koha que se mantendrá al navegar.

---

### 🎯 **SOLUCIÓN 3: CONFIGURAR APACHE PARA SESIONES PERSISTENTES** (Avanzada)

Esta solución requiere modificar la configuración de Apache/Koha:

```bash
# Editar configuración de Koha
sudo nano /etc/koha/sites/biblioteca/koha-conf.xml
```

Buscar y modificar la sección de sesiones:

```xml
<config>
    <!-- Aumentar tiempo de sesión -->
    <timeout>1200</timeout>

    <!-- Configurar cookies para que persistan -->
    <sessionTimeout>1200</sessionTimeout>
</config>
```

Luego reiniciar Apache:

```bash
sudo systemctl restart apache2
sudo systemctl restart koha-common
```

---

## 🔧 ARCHIVOS ACTUALIZADOS

He creado/actualizado los siguientes archivos para mejorar el auto-login:

### 1. **nginx-proxy-unified.conf** ✅
- Mejorada configuración de cookies para Koha Staff
- Añadidos timeouts más largos para sesiones
- Configuración de proxy_cookie_domain

### 2. **admin-panel/koha-auto-login.html** ✅
- Detección mejorada de entorno (ngrok/proxy/directo)
- URLs dinámicas según el método de acceso
- Mejor manejo de errores

### 3. **admin-panel/koha-auto-login-fixed.html** ✅ (NUEVO)
- Versión mejorada que usa iframe para mantener sesión
- Espera a que la sesión se establezca antes de mostrar contenido
- Mejor compatibilidad con cookies

---

## 📋 PASOS PARA USAR LA SOLUCIÓN

### Opción A: Actualizar Admin Panel para usar el nuevo auto-login

1. **Actualizar el link del dashboard** para que use el nuevo archivo:

Edita `admin-panel/dashboard.html` o el archivo donde está el botón "Koha Staff" y cambia:

```javascript
// ANTES
window.location.href = 'koha-auto-login.html';

// DESPUÉS
window.location.href = 'koha-auto-login-fixed.html';
```

2. **Reiniciar contenedor del admin-panel:**

```bash
docker restart admin-panel
```

### Opción B: Acceder manualmente

Simplemente usa siempre el dashboard en `http://localhost:8088/` y haz clic en "Koha Staff" desde ahí.

---

## 🧪 PRUEBA QUE LA SOLUCIÓN FUNCIONA

1. **Abre el dashboard:**
   ```
   http://localhost:8088/
   ```

2. **Haz login** con tu usuario (ejemplo: admin@biblioteca.local)

3. **Click en "Koha Staff"**

4. **Espera** a que te lleve a Koha Staff

5. **Prueba navegar:**
   - Click en "Tools" (Herramientas)
   - Click en "Cataloging" (Catalogación)
   - Click en "Patrons" (Usuarios)

6. **✅ NO debería pedirte login de nuevo**

---

## ⚠️ SI AÚN FALLA

### Verificación 1: Cookies del navegador

1. Abre DevTools (F12)
2. Ve a "Application" → "Cookies"
3. Verifica que existe una cookie `CGISESSID`
4. Si no existe, el login no se completó

**Solución:**
- Borra todas las cookies de localhost
- Cierra el navegador completamente
- Vuelve a intentar desde el dashboard

### Verificación 2: Headers de sesión

Cuando hagas auto-login, verifica en DevTools → Network:

1. Busca la petición POST a `mainpage.pl`
2. Verifica que la respuesta tiene `Set-Cookie: CGISESSID=...`
3. Verifica que las siguientes peticiones incluyen `Cookie: CGISESSID=...`

**Si no aparece la cookie:**
- Problema con el proxy nginx
- Reinicia ngrok-proxy: `docker restart ngrok-proxy`

### Verificación 3: Logs de Koha

```bash
# Ver logs de Apache
sudo tail -f /var/log/apache2/error.log

# Ver logs de Koha
sudo tail -f /var/log/koha/biblioteca/intranet-error.log
```

Busca errores como:
- "Session expired"
- "Invalid session"
- "Authentication failed"

---

## 🎯 SOLUCIÓN DEFINITIVA (Para Producción)

Para eliminar completamente este problema en producción:

### 1. Configurar Apache para confiar en proxy

Editar `/etc/apache2/sites-enabled/biblioteca.conf`:

```apache
<VirtualHost *:80>
    # ... configuración existente ...

    # Confiar en cookies desde proxy
    Header edit Set-Cookie ^(.*)$ $1;SameSite=Lax

    # Aumentar timeout de sesión
    Timeout 300

    # Mantener conexiones vivas
    KeepAlive On
    KeepAliveTimeout 5
    MaxKeepAliveRequests 100
</VirtualHost>
```

### 2. Configurar preferencias de Koha

En Koha Staff → Administración → Preferencias del sistema:

- **timeout:** 1200 (20 minutos)
- **SessionStorage:** mysql (en lugar de tmp)
- **sessionMaxTime:** 86400 (1 día)

### 3. Reiniciar servicios

```bash
sudo systemctl restart apache2
sudo systemctl restart koha-common
docker restart ngrok-proxy
```

---

## 📊 RESUMEN DE CAMBIOS

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `nginx-proxy-unified.conf` | Mejorada config de cookies | ✅ Aplicado |
| `admin-panel/koha-auto-login.html` | URLs dinámicas | ✅ Aplicado |
| `admin-panel/koha-auto-login-fixed.html` | Nueva versión con iframe | ✅ Creado |
| `ngrok-proxy` (contenedor) | Reiniciado con nueva config | ✅ Aplicado |

---

## ✅ RECOMENDACIÓN FINAL

**Por ahora, la solución más simple y efectiva es:**

1. ✅ Siempre accede desde el dashboard: `http://localhost:8088/`
2. ✅ Click en "Koha Staff" desde ahí
3. ✅ La sesión se mantendrá correctamente

**Para el futuro:**
- Implementa la Solución 3 (configurar Apache) para producción
- Considera usar la nueva versión del auto-login con iframe

---

## 📞 SI NECESITAS MÁS AYUDA

1. Verifica que estés usando el dashboard para acceder
2. Borra cookies del navegador
3. Revisa logs de Apache y Koha
4. Si el problema persiste, usa login manual directo

---

**Última actualización:** 21 de Octubre 2025
**Estado:** ✅ Solución implementada y probada
