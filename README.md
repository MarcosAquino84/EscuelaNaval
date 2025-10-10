# Sistema Integrado de Biblioteca Digital

[![DSpace](https://img.shields.io/badge/DSpace-7.6-blue.svg)](https://dspace.lyrasis.org/)
[![Koha](https://img.shields.io/badge/Koha-25.05.04-green.svg)](https://koha-community.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistema completo de gestión bibliotecaria y repositorio institucional digital, con autenticación centralizada (SSO), corriendo en arquitectura híbrida Ubuntu + Docker.

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Arquitectura](#-arquitectura)
- [Requisitos](#-requisitos)
- [Inicio Rápido](#-inicio-rápido)
- [Acceso al Sistema](#-acceso-al-sistema)
- [Credenciales](#-credenciales)
- [Componentes](#-componentes)
- [Documentación](#-documentación)
- [Comandos Útiles](#-comandos-útiles)
- [Solución de Problemas](#-solución-de-problemas)
- [Contribuir](#-contribuir)

---

## 🎯 Descripción

Sistema integrado para bibliotecas que combina:

- **DSpace 7.6**: Repositorio institucional digital para preservar y dar acceso a producción académica
- **Koha 25.05.04**: Sistema integrado de gestión bibliotecaria (ILS) para catalogación, circulación y préstamos
- **Auth Service**: Servicio de autenticación centralizada (Single Sign-On) para acceso unificado

**Características principales:**
- ✅ Login único (SSO) para ambos sistemas
- ✅ Interfaz completamente en español
- ✅ Arquitectura híbrida: Koha nativo + DSpace en Docker
- ✅ Panel de administración web integrado
- ✅ Base de datos PostgreSQL (DSpace) y MariaDB (Koha)
- ✅ Motores de búsqueda: Solr (DSpace) y Zebra (Koha)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE BIBLIOTECA                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   KOHA (Nativo)      │         │  DSpace (Docker)     │
│   Puerto 80          │         │  Puertos 4000/8090   │
├──────────────────────┤         ├──────────────────────┤
│ • Apache2 + Perl/CGI │         │ • Angular Frontend   │
│ • Zebra (búsqueda)   │         │ • Spring Boot API    │
│ • MariaDB (3307)     │         │ • PostgreSQL (5433)  │
│ • Background workers │         │ • Solr (8983)        │
│ • Idioma: es-ES      │         │ • Idioma: es         │
└──────────┬───────────┘         └──────────┬───────────┘
           │                                │
           └────────────┬───────────────────┘
                        │
           ┌────────────▼───────────────┐
           │  Auth Service (Docker)     │
           │  Puerto 3000               │
           ├────────────────────────────┤
           │ • Node.js + Express        │
           │ • Single Sign-On (SSO)     │
           │ • Panel Web (8081)         │
           │ • Gestión de sesiones      │
           └────────────────────────────┘
```

Ver [ARQUITECTURA.md](ARQUITECTURA.md) para más detalles.

---

## 💻 Requisitos

### Sistema Operativo
- **Ubuntu 22.04 LTS** o superior
- Arquitectura: x86_64 / AMD64
- Compatible con WSL2 (Windows Subsystem for Linux)

### Software
- Docker Engine 20.10+
- Docker Compose 2.0+
- Apache2 (para Koha)
- MariaDB 10.11+ (para Koha)
- Node.js 18+ (para Auth Service)

### Hardware Mínimo
- **CPU**: 4 cores
- **RAM**: 8 GB (recomendado 16 GB)
- **Disco**: 20 GB libres
- **Red**: Conexión a Internet para instalación

---

## 🚀 Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd biblioteca
```

### 2. Iniciar servicios

```bash
# Iniciar DSpace y Auth Service (Docker)
docker-compose up -d

# Verificar que Koha esté corriendo (nativo)
sudo systemctl status apache2
koha-list
```

### 3. Acceder al sistema

Abre tu navegador y ve a:

**Desde la misma máquina Ubuntu:**
```
http://localhost:8081/login.html
```

**Desde Windows (si usas WSL):**
```
http://172.27.72.64:8081/login.html
```

### 4. Credenciales por defecto

```
Email: admin@biblioteca.local
Password: admin123
```

---

## 🌐 Acceso al Sistema

### URLs Principales

| Servicio | URL Local | URL WSL (Windows) | Puerto |
|----------|-----------|-------------------|--------|
| **Panel Login** | http://localhost:8081/login.html | http://172.27.72.64:8081/login.html | 8081 |
| **Dashboard** | http://localhost:8081/dashboard.html | http://172.27.72.64:8081/dashboard.html | 8081 |
| **Koha Staff** | http://localhost/ | http://172.27.72.64/ | 80 |
| **Koha CGI** | http://localhost/cgi-bin/koha/ | http://172.27.72.64/cgi-bin/koha/ | 80 |
| **DSpace Frontend** | http://localhost:4000 | http://172.27.72.64:4000 | 4000 |
| **DSpace API** | http://localhost:8090/server/api | http://172.27.72.64:8090/server/api | 8090 |
| **Auth Service** | http://localhost:3000 | http://172.27.72.64:3000 | 3000 |

### URLs Administrativas

| Servicio | URL | Puerto |
|----------|-----|--------|
| **Solr Admin** | http://localhost:8983/solr | 8983 |
| **PostgreSQL** | localhost:5433 | 5433 |
| **MariaDB** | localhost:3307 | 3307 |
| **Memcached** | localhost:11212 | 11212 |

---

## 🔑 Credenciales

### Usuarios del Sistema

#### Administrador (Acceso completo)
```yaml
Email: admin@biblioteca.local
Password: admin123
Privilegios:
  - DSpace: ✅ Administrador
  - Koha: ✅ Superlibrarian
  - Panel Admin: ✅
```

#### Estudiante (Acceso limitado)
```yaml
Email: alumno@biblioteca.local
Password: alumno123
Privilegios:
  - DSpace: ✅ Usuario regular
  - Koha: ✅ Usuario biblioteca
  - Panel Admin: ❌
```

### Bases de Datos

#### PostgreSQL (DSpace)
```yaml
Host: localhost
Puerto: 5433
Base de datos: dspace
Usuario: dspace
Password: dspace
```

#### MariaDB (Koha)
```yaml
Host: localhost
Puerto: 3307
Base de datos: koha_biblioteca
Usuario: koha
Password: koha_password
Root Password: koha_root_password
```

⚠️ **Importante**: Cambiar estas credenciales en producción.

---

## 📦 Componentes

### 1. DSpace 7.6 (Contenedores Docker)

**Repositorio institucional digital** para preservar y dar acceso a la producción académica.

- **dspace-backend**: API REST (Spring Boot)
- **dspace-angular**: Frontend (Angular 16)
- **dspacedb**: Base de datos PostgreSQL 13
- **dspacesolr**: Motor de búsqueda Apache Solr

**Características:**
- Repositorio de documentos digitales
- Colecciones y comunidades
- Flujos de trabajo de aprobación
- Estadísticas de uso
- OAI-PMH para interoperabilidad
- Exportación en múltiples formatos

### 2. Koha 25.05.04 (Instalación Nativa)

**Sistema integrado de gestión bibliotecaria (ILS)** de código abierto.

- **Apache2 + Perl/CGI**: Interfaz web
- **Zebra**: Indexación y búsqueda bibliográfica
- **MariaDB**: Base de datos
- **Background Workers**: Procesos en segundo plano

**Características:**
- Catalogación MARC21
- Gestión de circulación (préstamos/devoluciones)
- OPAC (catálogo público)
- Gestión de adquisiciones
- Informes y estadísticas
- Control de autoridades

### 3. Auth Service (Contenedor Docker)

**Servicio de autenticación centralizada** desarrollado en Node.js.

- **auth-service**: Backend Express + Session management
- **Panel Web**: Login y Dashboard en HTML/Bootstrap

**Características:**
- Single Sign-On (SSO)
- Gestión de sesiones
- Verificación de privilegios
- Integración con DSpace API
- Panel de administración web

---

## 📚 Documentación

### Documentos Principales

- [ARQUITECTURA.md](ARQUITECTURA.md) - Arquitectura detallada del sistema
- [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md) - Estado actual de componentes
- [GUIA_DESARROLLO.md](GUIA_DESARROLLO.md) - Guía para desarrolladores
- [SISTEMA_SSO.md](SISTEMA_SSO.md) - Documentación del SSO
- [CREDENCIALES_SISTEMA.md](CREDENCIALES_SISTEMA.md) - Todas las credenciales

### Guías Específicas

- [CONFIGURACION_ESPAÑOL.md](CONFIGURACION_ESPAÑOL.md) - Configuración de idioma
- [SOLUCION_PROBLEMAS.md](SOLUCION_PROBLEMAS.md) - Troubleshooting
- [README_AUTO_LOGIN_FIX.md](README_AUTO_LOGIN_FIX.md) - Auto-login en DSpace

### Documentación Externa

- [DSpace Documentation](https://wiki.lyrasis.org/display/DSDOC7x)
- [Koha Manual](https://koha-community.org/manual/)
- [Docker Documentation](https://docs.docker.com/)

---

## 🛠️ Comandos Útiles

### Gestión de Docker (DSpace + Auth Service)

```bash
# Ver estado de contenedores
docker ps

# Ver logs
docker logs -f dspace-angular
docker logs -f auth-service

# Reiniciar servicios
docker-compose restart

# Detener todos los servicios
docker-compose down

# Iniciar servicios
docker-compose up -d

# Reconstruir imágenes
docker-compose build --no-cache
```

### Gestión de Koha (Nativo)

```bash
# Listar instancias de Koha
koha-list

# Ver estado de Apache
sudo systemctl status apache2

# Reiniciar Apache
sudo systemctl restart apache2

# Ver logs de Koha
sudo tail -f /var/log/koha/biblioteca/opac-error.log
sudo tail -f /var/log/koha/biblioteca/intranet-error.log

# Reindexar Zebra
sudo koha-rebuild-zebra -f -v biblioteca

# Backup de base de datos
sudo koha-dump biblioteca
```

### Verificación de Servicios

```bash
# Verificar puertos abiertos
sudo netstat -tulpn | grep -E '80|3000|4000|8090'

# Verificar conectividad
curl -I http://localhost:8081
curl -I http://localhost/cgi-bin/koha/
curl -I http://localhost:4000

# Verificar bases de datos
docker exec dspacedb pg_isready
docker exec koha-mariadb mysqladmin ping

# Verificar Auth Service
curl http://localhost:3000/health
```

---

## 🐛 Solución de Problemas

### Koha no responde

```bash
# Verificar Apache
sudo systemctl status apache2
sudo systemctl restart apache2

# Verificar base de datos
docker ps | grep mariadb
docker restart koha-mariadb

# Ver errores
sudo tail -f /var/log/apache2/error.log
```

### DSpace muestra pantalla blanca

```bash
# Verificar logs
docker logs dspace-angular

# Reiniciar frontend
docker restart dspace-angular

# Esperar compilación (3-5 minutos)
docker logs -f dspace-angular | grep "Compiled successfully"
```

### Auth Service no conecta

```bash
# Verificar servicio
docker ps | grep auth-service
docker logs auth-service

# Reiniciar servicio
docker restart auth-service

# Verificar puerto
curl http://localhost:3000/health
```

### Error de conexión entre servicios

```bash
# Verificar red Docker
docker network ls
docker network inspect biblioteca_dspacenet

# Verificar IP de WSL (si aplica)
ip addr show eth0 | grep inet

# Actualizar IP en archivos de configuración si es necesario
```

### Base de datos no acepta conexiones

```bash
# PostgreSQL (DSpace)
docker exec -it dspacedb psql -U dspace -d dspace -c "SELECT version();"

# MariaDB (Koha)
docker exec -it koha-mariadb mysql -u root -pkoha_root_password -e "SHOW DATABASES;"
```

Ver [SOLUCION_PROBLEMAS.md](SOLUCION_PROBLEMAS.md) para más detalles.

---

## 🚧 Estado del Proyecto

### ✅ Completado

- [x] Instalación de Koha nativo en Ubuntu
- [x] Instalación de DSpace en Docker
- [x] Sistema de autenticación centralizado (SSO)
- [x] Panel de login unificado
- [x] Dashboard de usuario
- [x] Configuración de idioma español en todos los componentes
- [x] Integración con DSpace API
- [x] Documentación completa

### 🔄 En Progreso

- [ ] Auto-login completo en Koha desde panel SSO
- [ ] Integración completa de privilegios entre sistemas
- [ ] Mejoras de seguridad (HTTPS, JWT)

### 📋 Pendiente

- [ ] Configuración HTTPS/SSL
- [ ] Autenticación LDAP/Active Directory
- [ ] Backup automatizado
- [ ] Monitoreo con Prometheus/Grafana
- [ ] Single Logout (SLO) sincronizado
- [ ] Tests automatizados

Ver [GUIA_DESARROLLO.md](GUIA_DESARROLLO.md) para roadmap completo.

---

## 👥 Contribuir

Contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

Ver [GUIA_DESARROLLO.md](GUIA_DESARROLLO.md) para guías de contribución.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

Los componentes individuales mantienen sus propias licencias:
- **DSpace**: BSD 3-Clause License
- **Koha**: GNU General Public License v3.0
- **Auth Service**: MIT License

---

## 📞 Soporte

Para problemas o preguntas:

1. Revisar [SOLUCION_PROBLEMAS.md](SOLUCION_PROBLEMAS.md)
2. Buscar en Issues existentes
3. Crear un nuevo Issue con detalles

---

## 🙏 Agradecimientos

- [DSpace Community](https://dspace.lyrasis.org/)
- [Koha Community](https://koha-community.org/)
- [Docker](https://www.docker.com/)
- Todos los contribuidores del proyecto

---

## 📊 Estadísticas

- **Versión**: 1.0.0
- **Última actualización**: Octubre 2025
- **Estado**: Producción (Desarrollo)
- **Contenedores activos**: 9
- **Servicios nativos**: 1 (Koha)
- **Idioma**: Español (es-ES)

---

**Desarrollado con ❤️ para bibliotecas**

```
Sistema Biblioteca Digital v1.0.0
Ubuntu + Docker | Koha + DSpace | Auth Service
```
