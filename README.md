# 🎓 Sistema Integrado de Biblioteca Digital HENM
## Heroica Escuela Naval Militar

> Sistema completo de gestión bibliotecaria con SSO (Single Sign-On), repositorio digital, gestión de citas de orientación educativa y diseño institucional.

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Principales](#componentes-principales)
4. [Base de Datos](#base-de-datos)
5. [Usuarios del Sistema](#usuarios-del-sistema)
6. [Funcionalidades](#funcionalidades)
7. [Tecnologías Utilizadas](#tecnologías-utilizadas)
8. [Acceso al Sistema](#acceso-al-sistema)

---

## 🎯 Descripción General

Sistema integrado de biblioteca digital que combina:
- **DSpace 7.x**: Repositorio digital institucional (Docker)
- **Koha**: Sistema integrado de gestión bibliotecaria - ILS (Ubuntu nativo)
- **Panel de Administración**: Interfaz unificada con SSO
- **Módulo de Orientación Educativa**: Gestión de citas con psicólogos/orientadores
- **Diseño Institucional**: Identidad visual HENM completa

### ✨ Características Principales

- ✅ **Login Centralizado (SSO)**: Un solo login para todos los sistemas
- ✅ **Auto-Login**: Acceso automático a DSpace y Koha sin credenciales adicionales
- ✅ **Gestión de Citas**: Sistema completo de orientación educativa
- ✅ **Diseño Institucional**: Colores, tipografía y elementos gráficos de la HENM
- ✅ **WSL2 + Windows**: Servicios en WSL, navegación desde Windows
- ✅ **Publicación Internet**: Acceso público vía Ngrok

---

## 🏗️ Arquitectura del Sistema

### Entorno de Ejecución

- **WSL2 Ubuntu 22.04**: Sistema operativo base
- **Docker + Docker Compose**: DSpace, Auth Service, Admin Panel
- **Ubuntu Nativo**: Koha con Apache2 y MariaDB
- **Windows Host**: Navegador para acceder a todos los servicios
- **Ngrok**: Túnel público para acceso desde Internet

### Diagrama de Componentes

\`\`\`
Internet (Ngrok) → Nginx Proxy (9000) → Servicios
                         ├─ / → Admin Panel (:8088)
                         ├─ /dspace → DSpace Angular (:4000)
                         ├─ /server → DSpace API (:8090)
                         ├─ /koha → Koha OPAC (:8080)
                         ├─ /koha-staff → Koha Staff (:80)
                         └─ /api → Auth Service (:3000)
\`\`\`

---

## 🧩 Componentes Principales

### 1. DSpace (Repositorio Digital) - DOCKER
- **Frontend**: Angular 15 (Puerto 4000)
- **Backend**: Spring Boot + Tomcat (Puerto 8090)
- **Base de Datos**: PostgreSQL (Puerto 5433)
- **Búsqueda**: Apache Solr (Puerto 8983)
- **Cores Solr**: search, authority, oai, statistics
- **Idioma**: Español
- **Función**: Repositorio institucional para tesis, artículos, recursos digitales

### 2. Koha (Sistema Bibliotecario) - UBUNTU NATIVO
- **Staff Interface**: http://localhost:80
- **OPAC**: http://localhost:8080
- **Base de Datos**: MariaDB 10.11 (Puerto 3307)
- **Cache**: Memcached (Puerto 11212)
- **Servidor**: Apache2 + Plack
- **Idioma**: Español
- **Función**: Catalogación, préstamos, adquisiciones, reportes

### 3. Panel de Administración - DOCKER
- **Framework**: HTML5 + Bootstrap 5 + JavaScript
- **Servidor**: Nginx (Puerto 8088)
- **Diseño**: Identidad visual HENM
- **Funciones**: Dashboard, gestión de usuarios, solicitud de citas

### 4. Auth Service (SSO) - DOCKER
- **Framework**: Node.js + Express
- **Puerto**: 3000
- **Base de Datos**: PostgreSQL (biblioteca_auth)
- **Autenticación**: bcrypt
- **Funciones**: Login centralizado, gestión de usuarios y citas

### 5. Nginx Proxy - DOCKER
- **Puerto**: 9000
- **Función**: Proxy reverso unificado
- **Compatible**: Plan gratuito Ngrok (1 túnel)

---

## 💾 Base de Datos

### PostgreSQL: biblioteca_auth (DSpace container)

**Tablas Principales**:

**usuarios**
- Todos los usuarios del sistema
- Tipos: administrador, estudiante, orientador
- Privilegios granulares por sistema

**citas**
- Gestión de citas de orientación educativa
- Estados: pendiente, aceptada, rechazada, completada
- Modalidades: presencial, virtual, telefónica

**disponibilidad_orientadores**
- Horarios de atención
- Lunes a Viernes: 9:00-12:00 y 14:00-17:00

**notificaciones**
- Sistema de alertas para usuarios

**propuestas_fecha**
- Cambios de horario de citas

### MariaDB: koha_biblioteca (Container MariaDB)

**Tablas Principales**:
- **borrowers**: Usuarios de la biblioteca
- **biblio**: Registros bibliográficos
- **items**: Ejemplares físicos
- **issues**: Préstamos activos
- **categories**: Tipos de usuario

### PostgreSQL: dspace (Container DSpace)

~200 tablas para gestión de:
- Colecciones y comunidades
- Items y bitstreams
- Metadata
- Permisos

---

## 👥 Usuarios del Sistema

### Administradores

| Email | Password | Permisos |
|-------|----------|----------|
| admin@biblioteca.local | admin123 | Acceso total |
| marcos@biblioteca.local | marcos123 | Acceso total |

### Orientadores/Psicólogos

| Email | Password | Especialidad | Horario |
|-------|----------|--------------|---------|
| psic.ramirez@henm.edu.mx | orientador123 | Psicología Clínica | L-V 9-12, 14-17 |
| psic.martinez@henm.edu.mx | orientador123 | Orientación Vocacional | L-V 9-12, 14-17 |
| psic.lopez@henm.edu.mx | orientador123 | Psicopedagogía | L-V 9-12, 14-17 |

### Estudiantes

| Email | Password |
|-------|----------|
| maria.garcia@estudiante.local | estudiante123 |
| alumno@biblioteca.local | alumno123 |

---

## ⚙️ Funcionalidades

### Sistema de Autenticación (SSO)

#### Login Centralizado
- Un solo login para todos los sistemas
- Sesiones persistentes con cookies HTTP-only
- Contraseñas hasheadas con bcrypt
- Validación de privilegios por usuario

#### Auto-Login
- **dspace-auto-login.html**: Autenticación automática en DSpace
- **koha-auto-login.html**: Login automático en Koha Staff
- **koha-opac-auto-login.html**: Login automático en OPAC

### Módulo de Orientación Educativa

#### Estudiantes:
- Solicitar citas con orientadores
- Ver historial de citas
- Cancelar citas
- Recibir notificaciones

#### Orientadores:
- Gestionar solicitudes de citas
- Aceptar/rechazar con mensajes
- Proponer fechas alternativas
- Marcar citas como completadas
- Agregar notas públicas y privadas

#### Administradores:
- Administrar todas las citas
- Ver estadísticas
- Gestionar horarios de orientadores

### Panel de Administración

- Dashboard unificado con acceso a todos los sistemas
- Gestión completa de usuarios (CRUD)
- Diseño institucional HENM completo:
  - Colores: Guinda (#9D2449), Verde (#2E7D32), Dorado (#D4AF37)
  - Tipografía: Montserrat
  - Headers institucionales (Gobierno de México, HENM)
  - Footer institucional

### DSpace - Repositorio Digital

- Comunidades y colecciones
- Depósito de items (tesis, artículos)
- Metadata Dublin Core
- Búsqueda avanzada con Solr
- Permisos granulares
- Workflows de aprobación
- OAI-PMH para interoperabilidad

### Koha - Sistema Bibliotecario

**Staff Interface**:
- Catalogación MARC21
- Circulación (préstamos, devoluciones)
- Adquisiciones
- Gestión de socios
- Reportes y estadísticas

**OPAC**:
- Búsqueda simple y avanzada
- Cuenta personal
- Renovaciones en línea
- Reservas

---

## 🛠️ Tecnologías Utilizadas

### Backend
- Node.js 18 (Auth Service)
- Spring Boot (DSpace)
- Perl/Plack (Koha)
- PostgreSQL 13
- MariaDB 10.11
- Apache Solr 8
- Memcached

### Frontend
- Angular 15 (DSpace UI)
- Bootstrap 5
- HTML5/CSS3/JavaScript
- Template Toolkit (Koha)
- jQuery

### Infraestructura
- Docker & Docker Compose
- Nginx (Proxy + Admin Panel)
- Apache 2.4 (Koha)
- WSL2 Ubuntu
- Ngrok

### Seguridad
- bcrypt (Passwords)
- express-session
- CORS configurado
- HTTPS (Ngrok)

---

## 🌐 Acceso al Sistema

### Local (WSL)

| Servicio | URL |
|----------|-----|
| Admin Panel | http://localhost:8088 |
| DSpace UI | http://localhost:4000 |
| DSpace API | http://localhost:8090/server/api |
| Koha Staff | http://localhost:80 |
| Koha OPAC | http://localhost:8080 |
| Auth Service | http://localhost:3000 |
| Proxy Unificado | http://localhost:9000 |

### Desde Windows

Usar IP de WSL (ejemplo: 172.27.72.64):
\`\`\`
http://172.27.72.64:8088
http://172.27.72.64:4000
\`\`\`

### Público (Ngrok)

\`\`\`
https://[subdominio].ngrok-free.dev/
https://[subdominio].ngrok-free.dev/dspace/
https://[subdominio].ngrok-free.dev/koha/
https://[subdominio].ngrok-free.dev/koha-staff/
\`\`\`

---

## 🚀 Comandos Útiles

### Iniciar Sistema

\`\`\`bash
# Iniciar todos los contenedores Docker
docker-compose up -d

# Verificar estado
docker-compose ps

# Ver logs
docker-compose logs -f
\`\`\`

### Iniciar Ngrok

\`\`\`bash
# Script automático
./iniciar-ngrok.sh

# Manual
ngrok http 9000 --host-header=rewrite
\`\`\`

### Gestión de Bases de Datos

\`\`\`bash
# Conectar a PostgreSQL (biblioteca_auth)
docker exec -it dspacedb psql -U dspace -d biblioteca_auth

# Ver usuarios
docker exec -i dspacedb psql -U dspace -d biblioteca_auth -c "SELECT email, nombre, tipo FROM usuarios;"

# Conectar a MariaDB (Koha)
docker exec -it koha-mariadb mysql -u koha -pkoha_password koha_biblioteca
\`\`\`

### Gestión de Solr

\`\`\`bash
# Ver cores activos
curl http://localhost:8983/solr/admin/cores?action=STATUS

# Crear cores (si no existen)
docker exec dspacesolr solr create_core -c search -d /opt/solr/server/solr/configsets/search
\`\`\`

### Reiniciar Servicios

\`\`\`bash
# Reiniciar DSpace
docker-compose restart dspace dspace-angular

# Reiniciar Auth Service
docker-compose restart auth-service

# Reiniciar todo
docker-compose restart
\`\`\`

---

## 📊 Estado del Sistema

### Versión: 2.0.0 - Octubre 2025

### Servicios Activos

- ✅ DSpace 7.6.6 - Completamente funcional
- ✅ Koha - Instalación nativa completa
- ✅ Auth Service - SSO operativo
- ✅ Admin Panel - Diseño institucional
- ✅ Módulo de Citas - Sistema completo
- ✅ Auto-Login - Funcionando
- ✅ Solr - 4 cores activos
- ✅ Bases de Datos - Operativas

---

## 📝 Notas Importantes

### WSL2 y Windows

- Los servicios corren en WSL2
- Accesibles desde Windows usando IP de WSL
- Docker Desktop debe tener integración WSL2 habilitada
- IP de WSL puede cambiar al reiniciar Windows

### Koha Nativo vs Docker

Koha está instalado nativamente en Ubuntu (no en Docker) por:
- Mayor estabilidad con Apache + Plack
- Mejor rendimiento
- Facilita personalización
- Compatibilidad con módulos Perl

### Seguridad

**Desarrollo**:
- Contraseñas por defecto (CAMBIAR EN PRODUCCIÓN)
- CORS permisivo
- Logs verbose

**Producción**:
- Cambiar todas las contraseñas
- Habilitar HTTPS nativo
- Configurar firewall
- Rate limiting
- Backups automáticos

---

## 🎖️ Créditos

Desarrollado para la **Heroica Escuela Naval Militar (HENM)**.

**Tecnologías Open Source**:
- DSpace Community
- Koha Community
- Docker Inc.
- PostgreSQL Global Development Group

---

**Última actualización**: Octubre 2025  
**Versión**: 2.0.0

© 2025 HENM - Todos los derechos reservados
