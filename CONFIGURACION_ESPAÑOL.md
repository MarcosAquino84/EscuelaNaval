# Configuración de Idioma Español - Sistema de Biblioteca

## ✅ Configuración Completada

Este documento describe todas las configuraciones aplicadas para que tanto DSpace como Koha funcionen en español.

---

## 🎯 DSpace - Configuración de Español

### 1. Archivo `local.cfg` (`dspace/config/local.cfg`)

Se han configurado las siguientes opciones:

```properties
# Idioma por defecto
default.locale = es
webui.supported.locales = es, en

# Zona horaria
default.timezone = America/Argentina/Buenos_Aires
```

### 2. Variables de Entorno en Docker Compose

#### Backend DSpace:
```yaml
environment:
  # Configuración de idioma español
  default__P__locale: 'es'
  webui__P__supported__P__locales: 'es'
  LANG: 'es_ES.UTF-8'
  LANGUAGE: 'es_ES:es'
  LC_ALL: 'es_ES.UTF-8'

  # Memoria Java con configuración de idioma
  JAVA_OPTS: '-Xmx2048m -Xms1024m -Duser.language=es -Duser.country=ES'
```

#### Frontend Angular DSpace:
```yaml
environment:
  # Configuración de idioma español
  LANG: 'es_ES.UTF-8'
  LANGUAGE: 'es_ES:es'
  LC_ALL: 'es_ES.UTF-8'
```

### 3. Cómo Verificar

1. Accede a http://localhost:4000
2. Busca el selector de idioma en la esquina superior derecha
3. Selecciona "Español" si no está ya seleccionado
4. La interfaz debe mostrarse completamente en español

---

## 🎯 Koha - Configuración de Español

### 1. Variables de Entorno en Docker Compose

Se agregaron variables de entorno en todos los servicios de Koha:

```yaml
environment:
  - LANG=es_ES.UTF-8
  - LANGUAGE=es_ES:es
  - LC_ALL=es_ES.UTF-8
```

### 2. Script de Configuración SQL

Se creó el script `configurar-espanol-koha.sh` que:

- Configura el idioma del sistema a `es-ES`
- Establece el OPAC en español
- Configura formato de hora 24h
- Actualiza todos los usuarios existentes a español

### 3. Cómo Aplicar la Configuración

Ejecuta el siguiente script después de iniciar los servicios:

```bash
./configurar-espanol-koha.sh
```

### 4. Configuración Manual (Alternativa)

Si prefieres configurar manualmente:

1. Accede a Koha Staff: http://localhost:8086/cgi-bin/koha/mainpage.pl
2. Usuario: `admin` / Contraseña: `admin123`
3. Ve a: **Más → Administración → Preferencias del sistema**
4. Busca **I18N/L10N**
5. Configura:
   - `language`: es-ES
   - `opaclanguages`: es-ES
   - `opaclanguagesdisplay`: Sí

---

## 🚀 Iniciar el Sistema con Configuración de Español

### Opción 1: Inicio Completo (Recomendado)

```bash
# 1. Detener todos los contenedores
docker-compose down

# 2. Iniciar servicios de base de datos
docker-compose up -d dspacedb dspacesolr koha-db koha-memcached

# 3. Esperar 15 segundos para que las BD estén listas
sleep 15

# 4. Iniciar aplicaciones
docker-compose up -d dspace dspace-angular koha-web koha-api

# 5. Aplicar configuración de español en Koha
./configurar-espanol-koha.sh

# 6. Verificar que todo esté corriendo
docker ps
```

### Opción 2: Inicio Rápido (Si ya están creados los contenedores)

```bash
# Iniciar todos los servicios
docker-compose up -d

# Esperar 20 segundos
sleep 20

# Aplicar configuración de español en Koha
./configurar-espanol-koha.sh
```

---

## 🔍 Verificación del Idioma

### DSpace

1. **Frontend (Angular)**
   - URL: http://localhost:4000
   - Buscar selector de idioma arriba a la derecha
   - Seleccionar "Español"
   - Verificar que menús y textos estén en español

2. **Backend API**
   - URL: http://localhost:8090/server/api
   - Las respuestas JSON incluirán metadatos en español

### Koha

1. **Staff Interface**
   - URL: http://localhost:8086/cgi-bin/koha/mainpage.pl
   - Login con admin/admin123
   - La interfaz debe estar en español

2. **OPAC Público**
   - URL: http://localhost:8085
   - Debe mostrarse en español automáticamente

3. **Panel de Administración**
   - URL: http://localhost:8081
   - Acceso unificado a ambos sistemas
   - Ver: http://localhost:8081/configurar-idioma.html para guía

---

## 🛠️ Solución de Problemas

### DSpace sigue en inglés

**Problema**: La interfaz de DSpace sigue mostrando textos en inglés.

**Soluciones**:

1. **Limpiar caché del navegador**
   ```
   Ctrl + Shift + Delete (Windows/Linux)
   Cmd + Shift + Delete (Mac)
   ```

2. **Verificar selector de idioma**
   - En la interfaz de DSpace (http://localhost:4000)
   - Buscar el selector de idioma (generalmente arriba a la derecha)
   - Seleccionar "Español" o "es"

3. **Recrear contenedor Angular**
   ```bash
   docker-compose stop dspace-angular
   docker-compose rm -f dspace-angular
   docker-compose up -d dspace-angular
   ```

4. **Verificar configuración**
   ```bash
   docker exec dspace cat /dspace/config/local.cfg | grep locale
   ```

### Koha sigue en inglés

**Problema**: La interfaz de Koha muestra textos en inglés.

**Soluciones**:

1. **Re-ejecutar script de configuración**
   ```bash
   ./configurar-espanol-koha.sh
   ```

2. **Verificar base de datos**
   ```bash
   docker exec -it koha-mariadb mysql -ukoha -pkoha_password -e \
     "USE koha_biblioteca; SELECT variable, value FROM systempreferences WHERE variable LIKE '%language%';"
   ```

3. **Configuración manual en Koha**
   - Ir a: Más → Administración → Preferencias del sistema → I18N/L10N
   - Cambiar `language` a `es-ES`
   - Guardar cambios

4. **Limpiar caché**
   ```bash
   docker restart koha-web koha-api
   ```

### No aparece el selector de idioma en DSpace

**Problema**: No se ve opción para cambiar de idioma.

**Solución**:

- Verificar que `webui.supported.locales` incluya `es` en `local.cfg`
- Si solo está configurado español, el selector no aparecerá (está bien)
- La interfaz debe estar directamente en español

---

## 📋 Archivos Modificados

### Archivos de Configuración

1. **`docker-compose.yml`**
   - Agregadas variables de entorno de idioma en todos los servicios
   - Configuración de JAVA_OPTS con `-Duser.language=es`

2. **`dspace/config/local.cfg`**
   - `default.locale = es`
   - `webui.supported.locales = es, en`
   - `default.timezone = America/Argentina/Buenos_Aires`

### Scripts Creados

1. **`configurar-espanol-koha.sh`**
   - Script automático para configurar Koha en español
   - Actualiza base de datos y preferencias del sistema

2. **`koha/web/configurar-idioma.html`**
   - Guía visual de configuración de idioma
   - Accesible en http://localhost:8081/configurar-idioma.html

3. **`CONFIGURACION_ESPAÑOL.md`** (este archivo)
   - Documentación completa de la configuración

---

## ✅ Checklist de Verificación

Usa este checklist para verificar que todo está configurado correctamente:

### DSpace
- [ ] Variable `default.locale = es` en `local.cfg`
- [ ] Variables de entorno en `docker-compose.yml` configuradas
- [ ] Frontend Angular muestra interfaz en español
- [ ] Backend API responde correctamente

### Koha
- [ ] Variables de entorno en `docker-compose.yml` configuradas
- [ ] Script `configurar-espanol-koha.sh` ejecutado exitosamente
- [ ] Staff Interface muestra textos en español
- [ ] OPAC muestra interfaz en español
- [ ] Preferencias del sistema configuradas a `es-ES`

### General
- [ ] Todos los contenedores corriendo: `docker ps`
- [ ] No hay errores en logs: `docker-compose logs`
- [ ] Panel de administración accesible en http://localhost:8081
- [ ] Guía de configuración accesible en http://localhost:8081/configurar-idioma.html

---

## 🌐 URLs de Acceso Rápido

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| Panel Admin | http://localhost:8081 | - |
| Guía de Idioma | http://localhost:8081/configurar-idioma.html | - |
| DSpace Frontend | http://localhost:4000 | - |
| DSpace API | http://localhost:8090/server/api | - |
| Koha Staff | http://localhost:8086/cgi-bin/koha/mainpage.pl | admin / admin123 |
| Koha OPAC | http://localhost:8085 | - |
| Solr Admin | http://localhost:8983/solr | - |

---

## 📞 Soporte

Si después de seguir todos los pasos aún tienes problemas:

1. Verifica los logs de los contenedores:
   ```bash
   docker-compose logs dspace
   docker-compose logs dspace-angular
   docker-compose logs koha-web
   ```

2. Verifica el estado de los contenedores:
   ```bash
   docker ps -a
   ```

3. Reinicia todo el sistema:
   ```bash
   docker-compose down
   docker-compose up -d
   ./configurar-espanol-koha.sh
   ```

---

**Fecha de Configuración**: 2025-10-09
**Sistema**: DSpace 7.x + Koha
**Idioma**: Español (es-ES / es_ES.UTF-8)
**Zona Horaria**: America/Argentina/Buenos_Aires
