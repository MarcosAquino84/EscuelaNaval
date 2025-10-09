# 🪟 Acceso a DSpace desde Windows (WSL)

## ⚠️ Problema Detectado

Estás usando **WSL (Windows Subsystem for Linux)** y accediendo desde el **navegador de Windows**.

**El problema**: `localhost` en el navegador de Windows **NO apunta a WSL**.

---

## ✅ Solución Aplicada

He configurado DSpace para usar la **IP de WSL** en lugar de `localhost`.

### Tu IP de WSL:
```
172.27.72.64
```

**Nota**: Esta IP puede cambiar si reinicias WSL o Windows.

---

## 🌐 URLs Correctas para Windows

Usa estas URLs desde tu **navegador en Windows**:

### DSpace (Repositorio Digital):
```
http://172.27.72.64:4000
```

### DSpace API:
```
http://172.27.72.64:8090/server/api
```

### Panel de Administración:
```
http://172.27.72.64:8081
```

### Solr:
```
http://172.27.72.64:8983/solr
```

---

## 📋 Cómo Acceder Paso a Paso

### 1. Abrir DSpace en Windows

En tu navegador de Windows (Chrome, Firefox, Edge):

```
http://172.27.72.64:4000
```

### 2. Esperar a que cargue (10-15 segundos)

La primera vez puede tardar un poco.

### 3. Seleccionar idioma español

- Busca el selector de idioma (arriba a la derecha)
- Selecciona "Español"

### 4. Si ves inglés, limpia la caché

- **Chrome**: `Ctrl + Shift + Delete`
- **Firefox**: `Ctrl + Shift + Delete`
- Marca "Imágenes y archivos en caché"
- Borra y recarga

---

## 🔧 Si la IP de WSL Cambia

La IP de WSL puede cambiar cuando:
- Reinicias WSL
- Reinicias Windows
- Cambias de red

### Para obtener la nueva IP:

Desde WSL (Ubuntu):
```bash
hostname -I | awk '{print $1}'
```

### Para actualizar la configuración:

1. **Obtener la nueva IP**:
   ```bash
   NEW_IP=$(hostname -I | awk '{print $1}')
   echo "Nueva IP: $NEW_IP"
   ```

2. **Editar docker-compose.yml**:
   Reemplaza todas las instancias de `172.27.72.64` con la nueva IP.

3. **Reiniciar servicios**:
   ```bash
   docker-compose restart dspace dspace-angular
   ```

4. **Esperar 2-3 minutos** para que Angular recompile.

---

## 🚀 Script Automático de Actualización de IP

He creado un script para facilitar esto:

```bash
./actualizar-ip-wsl.sh
```

Este script:
1. Detecta automáticamente tu IP de WSL
2. Actualiza el archivo docker-compose.yml
3. Reinicia los servicios
4. Muestra la nueva URL para acceder

---

## 🔍 Verificación

### Desde WSL (Ubuntu):

```bash
# Verificar que el backend responde
curl -I http://172.27.72.64:8090/server/api

# Debe devolver:
# HTTP/1.1 200
# Content-Language: es
```

### Desde Windows:

1. Abre PowerShell o CMD
2. Ejecuta:
   ```
   curl http://172.27.72.64:8090/server/api
   ```
3. O simplemente abre la URL en el navegador

---

## 📱 Acceso desde Otros Dispositivos (Opcional)

Si quieres acceder desde otros dispositivos en tu red local:

### 1. Obtener IP de Windows en la red local

En Windows (PowerShell):
```powershell
ipconfig | findstr IPv4
```

### 2. Configurar puerto forwarding (si es necesario)

Agregar reglas de firewall en Windows para permitir acceso a los puertos:
- 4000 (DSpace Frontend)
- 8090 (DSpace Backend)
- 8081 (Panel Admin)

---

## ⚙️ Configuración Aplicada

### docker-compose.yml:

```yaml
# Backend
dspace__P__server__P__url: 'http://172.27.72.64:8090/server'
dspace__P__ui__P__url: 'http://172.27.72.64:4000'
proxies__P__trusted__P__ipranges: '172.23.0, 172.27.0'

# Frontend Angular
DSPACE_REST_HOST: '172.27.72.64'
DSPACE_REST_PORT: '8090'
```

---

## 🐛 Solución de Problemas

### Problema 1: Pantalla blanca en Windows

**Causa**: La IP de WSL cambió

**Solución**:
```bash
# En WSL
hostname -I | awk '{print $1}'

# Actualizar docker-compose.yml con la nueva IP
# Reiniciar servicios
docker-compose restart dspace dspace-angular
```

### Problema 2: "No se puede acceder a este sitio"

**Causa**: El firewall de Windows está bloqueando el acceso

**Solución**:
1. Buscar "Firewall de Windows Defender"
2. Clic en "Configuración avanzada"
3. Agregar reglas de entrada para puertos 4000, 8090, 8081
4. Permitir conexiones

### Problema 3: Error de conexión desde Windows

**Causa**: WSL no está corriendo o los contenedores están detenidos

**Solución**:
```bash
# Verificar que WSL está corriendo
wsl -l -v

# Verificar contenedores en WSL
docker ps

# Si no hay contenedores, iniciar:
./iniciar-sistema-espanol.sh
```

---

## 📖 Documentación Relacionada

- `ESTADO_FINAL.txt` - Estado general del sistema
- `SOLUCION_ERROR_500.md` - Solución a errores de conexión
- `CONFIGURACION_ESPAÑOL.md` - Configuración de idioma
- `README_ESPAÑOL.md` - Guía rápida general

---

## ✅ Checklist de Verificación

Antes de reportar problemas, verifica:

- [ ] WSL está corriendo: `wsl -l -v`
- [ ] Contenedores están activos: `docker ps` (en WSL)
- [ ] IP de WSL es correcta: `hostname -I` (en WSL)
- [ ] Firewall de Windows permite las conexiones
- [ ] Estás usando la IP correcta en el navegador: `http://172.27.72.64:4000`
- [ ] Has esperado 2-3 minutos después de reiniciar servicios
- [ ] Has limpiado la caché del navegador

---

## 🎯 Resumen Rápido

### Para Acceder a DSpace desde Windows:

**URL**: http://172.27.72.64:4000

### Si no funciona:

1. Verifica la IP en WSL: `hostname -I`
2. Actualiza docker-compose.yml si cambió
3. Reinicia servicios: `docker-compose restart dspace dspace-angular`
4. Espera 2-3 minutos
5. Accede desde Windows: `http://[TU_IP_WSL]:4000`

---

**Fecha de Configuración**: 9 Octubre 2025
**IP de WSL**: 172.27.72.64
**Sistema**: DSpace 7.x en WSL/Ubuntu
**Acceso desde**: Windows (navegador)
**Estado**: ✅ Configurado para WSL
