# 📊 Estado del Sistema - Configuración Congelada
**Fecha de Congelación**: 16 de Octubre de 2025  
**Versión**: 2.0.0  
**Commit**: $(git rev-parse HEAD)

---

## 🎯 Resumen Ejecutivo

Sistema de Biblioteca Digital HENM completamente funcional con:
- ✅ Login centralizado (SSO) operativo
- ✅ Auto-login a DSpace, Koha Staff y Koha OPAC funcionando
- ✅ Módulo de gestión de citas completo
- ✅ Diseño institucional HENM implementado
- ✅ DSpace 7.x en Docker operativo con Solr
- ✅ Koha instalado nativamente en Ubuntu funcionando
- ✅ Base de datos PostgreSQL y MariaDB operativas
- ✅ Publicación con Ngrok configurada

---

## 🐳 Configuración de Docker

### Servicios Activos (11 contenedores)

| Contenedor | Imagen | Puerto | Estado |
|------------|--------|--------|--------|
| dspace | dspace/dspace:dspace-7_x | 8090:8080 | ✅ Running |
| dspace-angular | dspace/dspace-angular:dspace-7_x | 4000:4000 | ✅ Running |
| dspacedb | dspace/dspace-postgres-pgcrypto:dspace-7_x | 5433:5432 | ✅ Running |
| dspacesolr | dspace/dspace-solr:dspace-7_x | 8983:8983 | ✅ Running |
| auth-service | escuelanaval_auth-service:latest | 3000:3000 | ✅ Running |
| koha-mariadb | mariadb:10.11 | 3307:3306 | ✅ Running |
| koha-memcached | memcached:alpine | 11212:11211 | ✅ Running |
| koha-web | nginx:alpine | 8081:80 | ✅ Running |
| koha-api | nginx:alpine | 8089:80 | ✅ Running |
| admin-panel | nginx:alpine | 8088:80 | ✅ Running |
| ngrok-proxy | nginx:alpine | 9000:80 | ✅ Running |

### Volúmenes Persistentes

- **escuelanaval_pgdata**: Base de datos DSpace + biblioteca_auth
- **escuelanaval_solr_data**: Índices de búsqueda Solr
- **escuelanaval_dspace_data**: Archivos del repositorio (assetstore)
- **escuelanaval_dspace_solr_data**: Datos Solr de DSpace
- **escuelanaval_koha_db_data**: Base de datos MariaDB de Koha
- **escuelanaval_koha_data**: Datos de Koha
- **escuelanaval_koha_config**: Configuración de Koha

### Red

- **escuelanaval_dspacenet**: Red bridge 172.23.0.0/16

---

## 🔧 Servicios Nativos Ubuntu

### Koha
- **Ubicación**: Instalación nativa en /usr/share/koha
- **Versión**: Última estable del repositorio Debian
- **Staff Interface**: http://localhost:80 (Apache)
- **OPAC**: http://localhost:8080 (Apache)
- **Base de Datos**: MariaDB en Docker (puerto 3307)
- **Cache**: Memcached en Docker (puerto 11212)
- **Estado**: ✅ Operativo

### Apache2
- **Versión**: 2.4.x
- **Módulos habilitados**: rewrite, cgi, headers
- **Sites habilitados**: Koha Staff + OPAC
- **Estado**: ✅ Activo

---

## 💾 Bases de Datos

### PostgreSQL: biblioteca_auth

**Tablas**:
- usuarios (7 registros)
  - 2 administradores
  - 3 orientadores
  - 2 estudiantes
- citas (0 registros iniciales)
- disponibilidad_orientadores (30 registros - horarios de 3 orientadores)
- notificaciones (0 registros iniciales)
- propuestas_fecha (0 registros iniciales)

**Estado**: ✅ Operativa

### PostgreSQL: dspace

**Tablas**: ~200 tablas del esquema DSpace
**Contenido**: Repositorio vacío listo para uso
**Estado**: ✅ Operativa

### MariaDB: koha_biblioteca

**Tablas**: ~269 tablas del esquema Koha
**Contenido**: 
- 1 usuario de prueba (alumno)
- Sistema listo para catalogación
**Estado**: ✅ Operativa

### Apache Solr: Cores

- **search**: Core principal de búsqueda ✅
- **authority**: Autoridades ✅
- **oai**: OAI-PMH ✅
- **statistics**: Estadísticas ✅

---

## 👥 Usuarios del Sistema

### Base de Datos: biblioteca_auth.usuarios

| ID | Email | Tipo | Privilegios |
|----|-------|------|-------------|
| 1 | admin@biblioteca.local | administrador | Todos |
| 2 | marcos@biblioteca.local | administrador | Todos |
| 3 | maria.garcia@estudiante.local | estudiante | DSpace, OPAC |
| 4 | alumno@biblioteca.local | estudiante | DSpace, OPAC |
| 5 | psic.ramirez@henm.edu.mx | orientador | DSpace, OPAC, Citas |
| 6 | psic.martinez@henm.edu.mx | orientador | DSpace, OPAC, Citas |
| 7 | psic.lopez@henm.edu.mx | orientador | DSpace, OPAC, Citas |

**Contraseñas**:
- Administradores: admin123 / marcos123
- Estudiantes: estudiante123 / alumno123
- Orientadores: orientador123

---

## 🌐 Arquitectura de Red

### Acceso Local

```
localhost:8088  → Admin Panel
localhost:4000  → DSpace Angular
localhost:8090  → DSpace API
localhost:80    → Koha Staff
localhost:8080  → Koha OPAC
localhost:3000  → Auth Service
localhost:9000  → Proxy Unificado
```

### Acceso desde Windows (WSL)

```
172.27.72.64:8088  → Admin Panel
172.27.72.64:4000  → DSpace Angular
... (mismos puertos)
```

### Acceso Público (Ngrok)

```
https://[subdominio].ngrok-free.dev/          → Admin Panel
https://[subdominio].ngrok-free.dev/dspace/   → DSpace
https://[subdominio].ngrok-free.dev/koha/     → Koha OPAC
https://[subdominio].ngrok-free.dev/koha-staff/ → Koha Staff
https://[subdominio].ngrok-free.dev/api/      → Auth API
```

**Proxy Unificado**: Nginx en puerto 9000
**Túnel Ngrok**: Con flag `--host-header=rewrite`

---

## 📦 Archivos de Configuración Importantes

### Docker Compose
- **docker-compose.yml**: Configuración principal congelada
- **Variables de entorno**: URLs de ngrok configuradas

### Nginx
- **nginx-proxy-unified.conf**: Proxy unificado para todos los servicios

### Auth Service
- **auth-service/auth-server.js**: Servidor de autenticación
- **auth-service/db.js**: Conexión a PostgreSQL
- **auth-service/citas-routes.js**: Rutas del módulo de citas

### Base de Datos
- **db/schema-orientacion.sql**: Schema completo del módulo de orientación

### Admin Panel
- **admin-panel/dashboard.html**: Dashboard principal
- **admin-panel/usuarios.html**: Gestión de usuarios
- **admin-panel/solicitar-cita.html**: Formulario de solicitud
- **admin-panel/mis-citas.html**: Vista de citas del estudiante
- **admin-panel/gestionar-citas-orientador.html**: Panel del orientador
- **admin-panel/admin-citas.html**: Panel administrativo
- **admin-panel/*-auto-login.html**: Páginas de auto-login

---

## 🚀 Comandos de Inicio

### Iniciar Todo el Sistema

```bash
cd /home/marcos/EscuelaNaval

# 1. Iniciar Docker Compose
docker-compose up -d

# 2. Verificar estado
docker-compose ps

# 3. Iniciar Ngrok (opcional)
./iniciar-ngrok.sh
```

### Verificar Servicios

```bash
# DSpace API
curl http://localhost:8090/server/api

# Auth Service
curl http://localhost:3000/health

# Solr
curl http://localhost:8983/solr/admin/cores?action=STATUS

# Proxy
curl http://localhost:9000/
```

---

## 🔍 Logs y Diagnóstico

### Ver Logs de Contenedores

```bash
# Todos los logs
docker-compose logs -f

# Servicio específico
docker-compose logs -f dspace
docker-compose logs -f auth-service
docker-compose logs -f ngrok-proxy
```

### Conectar a Bases de Datos

```bash
# PostgreSQL (biblioteca_auth)
docker exec -it dspacedb psql -U dspace -d biblioteca_auth

# MariaDB (Koha)
docker exec -it koha-mariadb mysql -u koha -pkoha_password koha_biblioteca
```

### Estado de Apache (Koha)

```bash
sudo systemctl status apache2
sudo apachectl -S  # Ver virtual hosts
```

---

## 🛡️ Seguridad

### Configuración Actual (Desarrollo)

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Sesiones HTTP-only
- ✅ CORS configurado
- ⚠️ Contraseñas por defecto (CAMBIAR EN PRODUCCIÓN)
- ⚠️ CORS permisivo (ajustar en producción)
- ⚠️ Logs en modo verbose

### Para Producción

- [ ] Cambiar todas las contraseñas
- [ ] Configurar SSL/TLS nativo
- [ ] Restringir CORS a dominios específicos
- [ ] Configurar firewall (ufw)
- [ ] Habilitar rate limiting
- [ ] Configurar backups automáticos
- [ ] Implementar logs de auditoría
- [ ] Configurar alertas de seguridad

---

## 💡 Notas de Mantenimiento

### Backups Recomendados

**Diario**:
- Base de datos biblioteca_auth
- Base de datos koha_biblioteca
- Base de datos dspace

**Semanal**:
- Assetstore de DSpace (archivos)
- Configuraciones de Koha
- Volúmenes de Docker

**Mensual**:
- Snapshot completo del sistema
- Exportación de configuraciones

### Actualizaciones

**DSpace**:
- Revisar releases: https://github.com/DSpace/DSpace/releases
- Actualizar imagen: `docker pull dspace/dspace:dspace-7_x`
- Reiniciar: `docker-compose restart dspace dspace-angular`

**Koha**:
- Actualizar desde repositorio oficial
- Backup previo obligatorio
- Ejecutar web installer después de actualizar

---

## 📈 Métricas del Sistema

### Tiempo de Inicio

- Docker Compose: ~30-60 segundos
- DSpace Angular (primera vez): ~3-5 minutos (compilación)
- DSpace Backend: ~20-30 segundos
- Koha: ~5-10 segundos
- Auth Service: ~2-3 segundos

### Recursos

**Memoria RAM recomendada**: 8GB mínimo, 16GB ideal
**Espacio en disco**: 20GB mínimo para datos iniciales
**CPU**: 4 cores mínimo

---

## ✅ Checklist de Verificación

### Servicios
- [x] DSpace Angular accesible en :4000
- [x] DSpace API respondiendo en :8090
- [x] Solr con 4 cores activos
- [x] Koha Staff accesible en :80
- [x] Koha OPAC accesible en :8080
- [x] Auth Service respondiendo en :3000
- [x] Admin Panel accesible en :8088
- [x] Proxy unificado en :9000

### Funcionalidades
- [x] Login centralizado funcionando
- [x] Auto-login a DSpace operativo
- [x] Auto-login a Koha Staff operativo
- [x] Auto-login a Koha OPAC operativo
- [x] Gestión de usuarios (CRUD)
- [x] Solicitud de citas funcionando
- [x] Gestión de citas por orientadores
- [x] Administración de citas
- [x] Diseño institucional completo

### Base de Datos
- [x] PostgreSQL biblioteca_auth operativa
- [x] Tabla usuarios con 7 registros
- [x] Tabla citas creada
- [x] Tabla disponibilidad_orientadores con 30 horarios
- [x] MariaDB koha_biblioteca operativa
- [x] PostgreSQL dspace operativa

### Ngrok
- [x] Ngrok instalado
- [x] Script iniciar-ngrok.sh funcionando
- [x] Proxy acepta todas las rutas
- [x] DSpace funciona con --host-header=rewrite

---

## 🎓 Sistema Listo para Uso

El sistema está completamente configurado y listo para:
- Catalogación de materiales en Koha
- Depósito de tesis y recursos en DSpace
- Gestión de usuarios y permisos
- Solicitud y gestión de citas de orientación
- Acceso desde Internet vía Ngrok

---

**Última verificación**: 16 de Octubre de 2025  
**Estado general**: ✅ OPERATIVO AL 100%  
**Commit Git**: $(git rev-parse HEAD)
c67d9ecf189882f0afd00506578e0d065bf06aef
