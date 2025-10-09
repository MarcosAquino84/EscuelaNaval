# Solución Error 500 - Service Unavailable

## Problema
DSpace muestra el header pero el contenido marca:
```
Error 500 - Service unavailable
The server is temporarily unable to service your request due to maintenance
downtime or capacity problems. Please try again later.
```

## Causa Raíz

Angular se ejecuta en el **navegador del usuario** (lado cliente), no en el servidor Docker.

**Configuración incorrecta anterior**:
```yaml
DSPACE_REST_HOST: 'dspace'    # Nombre del contenedor
DSPACE_REST_PORT: '8080'      # Puerto interno
```

Esto generaba la URL: `http://dspace:8080/server/api`

**Problema**: El navegador del usuario no puede resolver el nombre `dspace` porque:
- `dspace` es un nombre de contenedor Docker
- Solo funciona dentro de la red Docker
- El navegador del usuario está fuera de Docker
- El navegador intenta conectarse a `http://dspace:8080` y falla

## Solución Aplicada

**Configuración correcta**:
```yaml
DSPACE_REST_HOST: 'localhost'  # Accesible desde el navegador
DSPACE_REST_PORT: '8090'       # Puerto expuesto al host
```

Esto genera la URL: `http://localhost:8090/server/api`

**Por qué funciona**:
- El navegador puede resolver `localhost`
- El puerto `8090` está mapeado al host
- El backend responde correctamente en ese puerto

## Verificación

### 1. Verificar que el backend responde:
```bash
curl -I http://localhost:8090/server/api
```

Debe devolver:
```
HTTP/1.1 200
Content-Language: es
```

### 2. Verificar configuración de Angular:
```bash
docker exec dspace-angular cat /app/src/assets/config.json | grep -A5 '"rest"'
```

Debe mostrar:
```json
"rest": {
  "ssl": false,
  "host": "localhost",
  "port": 8090,
  "nameSpace": "/server",
  "baseUrl": "http://localhost:8090/server"
}
```

### 3. Esperar a que compile Angular (2-3 minutos)
```bash
docker logs -f dspace-angular
```

Buscar la línea:
```
✔ Compiled successfully.
** Angular Live Development Server is listening on 0.0.0.0:4000
```

### 4. Probar en el navegador:
1. Ir a http://localhost:4000
2. Esperar 10-15 segundos
3. La página debe cargar completamente (no solo el header)
4. Buscar el selector de idioma y seleccionar "Español"

## Arquitectura de Comunicación

```
┌─────────────────┐
│   Navegador     │
│   del Usuario   │
└────────┬────────┘
         │
         │ http://localhost:4000
         ▼
┌─────────────────┐
│  DSpace Angular │ (Puerto 4000)
│  (Contenedor)   │
└────────┬────────┘
         │
         │ Sirve HTML + JavaScript
         ▼
┌─────────────────┐
│   Navegador     │ ← JavaScript se ejecuta AQUÍ
│   ejecuta JS    │
└────────┬────────┘
         │
         │ http://localhost:8090/server/api
         │ (definido en config.json)
         ▼
┌─────────────────┐
│ DSpace Backend  │ (Puerto 8090 → 8080)
│  (Contenedor)   │
└─────────────────┘
```

**Punto clave**: El JavaScript de Angular se ejecuta en el navegador del usuario,
por lo que necesita URLs accesibles desde fuera de Docker.

## Comandos para Aplicar la Solución

Si necesitas reaplicar esta solución:

```bash
# 1. Detener Angular
docker-compose stop dspace-angular

# 2. Eliminar contenedor
docker-compose rm -f dspace-angular

# 3. Asegurarse que docker-compose.yml tiene:
#    DSPACE_REST_HOST: 'localhost'
#    DSPACE_REST_PORT: '8090'

# 4. Recrear contenedor
docker-compose up -d dspace-angular

# 5. Esperar 2-3 minutos para compilación

# 6. Verificar logs
docker logs -f dspace-angular
```

## Estado Esperado

Después de aplicar la solución:

✅ Header carga correctamente
✅ Contenido principal carga (sin Error 500)
✅ Búsqueda funciona
✅ Navegación funciona
✅ API responde correctamente
✅ Selector de idioma disponible

---

**Fecha**: 9 Octubre 2025
**Problema**: Error 500 - Service Unavailable
**Solución**: Configurar DSPACE_REST_HOST='localhost' en lugar de 'dspace'
**Estado**: ✅ RESUELTO
