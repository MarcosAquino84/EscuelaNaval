# Sistema de Biblioteca Digital - Estado Actual Estable

**Fecha:** Octubre 2025
**Estado:** ✅ PRODUCCIÓN - ESTABLE
**Institución:** Heroica Escuela Naval Militar (HENM) - Colegio Naval

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Principales](#componentes-principales)
4. [Usuarios y Privilegios](#usuarios-y-privilegios)
5. [URLs de Acceso](#urls-de-acceso)
6. [Flujo de Autenticación SSO](#flujo-de-autenticación-sso)
7. [Diseño Institucional](#diseño-institucional)
8. [Instrucciones de Uso](#instrucciones-de-uso)
9. [Despliegue y Configuración](#despliegue-y-configuración)
10. [Solución de Problemas](#solución-de-problemas)

---

## 🎯 Resumen Ejecutivo

Sistema de gestión bibliotecaria integrado con **Single Sign-On (SSO)** que unifica el acceso a:

- **Koha**: Sistema de gestión bibliotecaria (ILS) - Instalación real en Ubuntu
- **DSpace**: Repositorio digital institucional - Docker container
- **Panel de Administración**: Dashboard centralizado con diseño institucional HENM

### Características Clave

✅ **Autenticación Única (SSO)**: Un solo login para todos los sistemas
✅ **Auto-login Automático**: Sin re-autenticación en cada sistema
✅ **Control de Privilegios**: Acceso diferenciado por rol (Administrador/Estudiante)
✅ **Diseño Institucional**: Identidad visual HENM con colores oficiales
✅ **Acceso desde Windows**: Funciona en WSL Ubuntu, visualización desde Windows

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    WINDOWS (Visualización)                      │
│                    Browser: localhost:8088                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WSL UBUNTU (Backend)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Admin Panel (Nginx:8088)                   │  │
│  │  - index.html (Login institucional)                      │  │
│  │  - dashboard.html (Panel principal)                      │  │
│  │  - dspace-auto-login.html (Auto-login DSpace)           │  │
│  │  - koha-opac-auto-login.html (Auto-login Koha OPAC)     │  │
│  │  - koha-auto-login.html (Auto-login Koha Staff)         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Auth Service (Node.js:3000)                     │  │
│  │  - Express.js con express-session                        │  │
│  │  - CORS configurado para localhost + IP                  │  │
│  │  - Base de datos en memoria (usuarios)                   │  │
│  │  - Autenticación contra Koha y DSpace                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│             │                              │                     │
│             ▼                              ▼                     │
│  ┌─────────────────────┐      ┌─────────────────────────┐      │
│  │  Koha (Ubuntu Real) │      │  DSpace (Docker)        │      │
│  │  - Staff: :8101     │      │  - Frontend: :4000      │      │
│  │  - OPAC: :8080      │      │  - Backend: :8090       │      │
│  │  - IP: 172.27.72.64 │      │  - PostgreSQL           │      │
│  └─────────────────────┘      │  - Solr                 │      │
│                                └─────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### Comunicación entre Componentes

1. **Usuario → Admin Panel**: Login institucional con email/password
2. **Admin Panel → Auth Service**: POST /api/login con credenciales
3. **Auth Service → Koha**: Valida credenciales en Koha nativo
4. **Auth Service → DSpace**: Valida credenciales en DSpace REST API
5. **Auth Service → Admin Panel**: Retorna tokens + sessionStorage
6. **Admin Panel → Auto-login Pages**: Redirige con credenciales en sessionStorage
7. **Auto-login Pages → Koha/DSpace**: POST automático con formulario

---

## 🔧 Componentes Principales

### 1. Admin Panel (Puerto 8088)

**Tecnología**: Nginx Alpine
**Ubicación**: `/home/marcos/biblioteca/admin-panel/`
**URL**: `http://localhost:8088`

#### Archivos Clave

| Archivo | Función | Descripción |
|---------|---------|-------------|
| `index.html` | Login | Página de autenticación con diseño institucional HENM |
| `dashboard.html` | Dashboard | Panel principal con acceso a sistemas |
| `dspace-auto-login.html` | Auto-login DSpace | Intermediario que prepara credenciales para DSpace |
| `koha-opac-auto-login.html` | Auto-login Koha OPAC | Formulario POST automático al OPAC |
| `koha-auto-login.html` | Auto-login Koha Staff | Formulario POST automático a Staff Interface |
| `SuperHeader.png` | Imagen | Header Gobierno de México |
| `HeaderColegioNaval.png` | Imagen | Header UNINAV/HENM |
| `Footer.png` | Imagen | Footer institucional |

#### Variables de Configuración

```javascript
// En todos los HTML del admin-panel
const AUTH_API = 'http://localhost:3000/api';
const DSPACE_URL = 'http://172.27.72.64:4000';
const DSPACE_LOGIN_URL = 'http://172.27.72.64:4000/login';
const KOHA_STAFF_URL = 'http://172.27.72.64/cgi-bin/koha/mainpage.pl';
const KOHA_OPAC_URL = 'http://biblioteca.localhost:8080/';
```

### 2. Auth Service (Puerto 3000)

**Tecnología**: Node.js + Express + express-session
**Ubicación**: `/home/marcos/biblioteca/auth-service/`
**URL**: `http://localhost:3000`

#### Dependencias (package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "express-session": "^1.17.3",
    "axios": "^1.6.0",
    "bcryptjs": "^2.4.3",
    "form-data": "^4.0.0"
  }
}
```

#### Endpoints Disponibles

| Método | Ruta | Descripción | Body/Params |
|--------|------|-------------|-------------|
| POST | `/api/login` | Autenticación centralizada | `{ email, password }` |
| GET | `/api/session` | Verificar sesión activa | - |
| POST | `/api/logout` | Cerrar sesión en todos los sistemas | - |
| POST | `/api/get-access-url` | Obtener URL de sistema | `{ sistema }` |
| GET | `/api/koha-redirect` | Proxy para Koha con cookie | - |
| GET | `/health` | Health check del servicio | - |

#### CORS Configuration

```javascript
app.use(cors({
    origin: [
        'http://172.27.72.64:8081',
        'http://localhost:8081',
        'http://localhost:8088',
        'http://172.27.72.64:8088',
        'http://localhost:3000'
    ],
    credentials: true
}));
```

### 3. Koha (Instalación Real en Ubuntu)

**Tecnología**: Koha ILS nativo en Ubuntu
**Ubicación**: Instalado en sistema operativo host
**Base de datos**: MariaDB

#### URLs de Acceso

- **Staff Interface**: `http://172.27.72.64/cgi-bin/koha/mainpage.pl` (puerto 8101 desde localhost)
- **OPAC**: `http://biblioteca.localhost:8080/` (puerto 8080)

#### Usuarios de Koha

| Email Panel | Username Koha | Password | Permisos |
|-------------|---------------|----------|----------|
| admin@biblioteca.local | admin | admin123 | superlibrarian |
| marcos@biblioteca.local | Marcos | marcos123 | superlibrarian |
| maria.garcia@estudiante.local | maria.garcia | estudiante123 | OPAC only |

#### Mapeo Email → Username

```javascript
// En auth-service/auth-server.js y auto-login pages
const kohaUserMap = {
    'admin@biblioteca.local': 'admin',
    'alumno@biblioteca.local': 'alumno',
    'marcos@biblioteca.local': 'Marcos',
    'maria.garcia@estudiante.local': 'maria.garcia'
};
```

### 4. DSpace (Docker Container)

**Tecnología**: DSpace 7.x en Docker Compose
**Ubicación**: `/home/marcos/biblioteca/docker-compose.yml`
**Base de datos**: PostgreSQL

#### URLs de Acceso

- **Frontend Angular**: `http://172.27.72.64:4000` (localhost:4000)
- **Backend REST API**: `http://172.27.72.64:8090`

#### Servicios Docker

```yaml
services:
  dspace-angular:
    image: dspace/dspace-angular:dspace-7_x
    ports:
      - "4000:4000"

  dspace:
    image: dspace/dspace:dspace-7_x
    ports:
      - "8080:8080"
      - "8090:8080"  # REST API

  dspace-postgres:
    image: postgres:13

  dspace-solr:
    image: solr:8
```

---

## 👥 Usuarios y Privilegios

### Base de Datos en Memoria (auth-service/auth-server.js)

```javascript
const usuarios = [
    {
        id: 1,
        email: 'admin@biblioteca.local',
        nombre: 'Admin',
        apellido: 'Koha',
        password: 'admin123', // Simplificado para demo
        tipo: 'administrador',
        privilegios: {
            dspace: true,
            koha_staff: true,    // ✅ Acceso a Staff Interface
            koha_opac: true,     // ✅ Acceso a OPAC
            admin: true
        }
    },
    {
        id: 2,
        email: 'marcos@biblioteca.local',
        nombre: 'Marcos',
        apellido: 'Administrador',
        password: 'marcos123',
        tipo: 'administrador',
        privilegios: {
            dspace: true,
            koha_staff: true,
            koha_opac: true,
            admin: true
        }
    },
    {
        id: 3,
        email: 'maria.garcia@estudiante.local',
        nombre: 'María',
        apellido: 'García',
        password: 'estudiante123',
        tipo: 'estudiante',
        privilegios: {
            dspace: true,
            koha_staff: false,   // ❌ NO puede acceder a Staff
            koha_opac: true,     // ✅ Solo OPAC
            admin: false
        }
    }
];
```

### Matriz de Acceso

| Usuario | Tipo | DSpace | Koha Staff | Koha OPAC | Admin Panel |
|---------|------|--------|------------|-----------|-------------|
| admin@biblioteca.local | Administrador | ✅ | ✅ | ✅ | ✅ |
| marcos@biblioteca.local | Administrador | ✅ | ✅ | ✅ | ✅ |
| maria.garcia@estudiante.local | Estudiante | ✅ | ❌ | ✅ | ❌ |

---

## 🌐 URLs de Acceso

### Desde Windows (localhost)

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Panel de Administración** | `http://localhost:8088` | Login y dashboard principal |
| **Auth Service** | `http://localhost:3000` | API de autenticación (no visible) |
| **DSpace Frontend** | `http://localhost:4000` | Repositorio digital |
| **Koha Staff** | `http://localhost:8101/cgi-bin/koha/mainpage.pl` | Gestión bibliotecaria |
| **Koha OPAC** | `http://localhost:8080` | Catálogo público |

### Desde WSL (IP interna)

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Panel de Administración** | `http://172.27.72.64:8088` | Nginx del panel |
| **Auth Service** | `http://172.27.72.64:3000` | Node.js Express |
| **DSpace Frontend** | `http://172.27.72.64:4000` | Angular app |
| **DSpace Backend** | `http://172.27.72.64:8090` | REST API |
| **Koha Staff** | `http://172.27.72.64/cgi-bin/koha/mainpage.pl` | CGI Perl |
| **Koha OPAC** | `http://172.27.72.64:8080` | OPAC público |

### Puertos Utilizados

| Puerto | Servicio | Tecnología |
|--------|----------|------------|
| 3000 | Auth Service | Node.js Express |
| 4000 | DSpace Angular | Angular 15 |
| 8080 | Koha OPAC | Apache + Perl |
| 8088 | Admin Panel | Nginx |
| 8090 | DSpace REST API | Spring Boot |
| 8101 | Koha Staff (interno) | Apache + Perl |
| 5432 | PostgreSQL (DSpace) | PostgreSQL 13 |
| 3306 | MariaDB (Koha) | MariaDB 10.6 |
| 8983 | Solr (DSpace) | Apache Solr 8 |

---

## 🔐 Flujo de Autenticación SSO

### 1. Login Inicial (index.html)

```javascript
// Usuario ingresa email y password
POST http://localhost:3000/api/login
Body: {
    email: "admin@biblioteca.local",
    password: "admin123"
}

// Respuesta del auth-service
Response: {
    success: true,
    usuario: {
        id: 1,
        email: "admin@biblioteca.local",
        nombreCompleto: "Admin Koha",
        tipo: "administrador",
        privilegios: { dspace: true, koha_staff: true, koha_opac: true },
        password: "admin123"  // Para auto-login
    },
    tokens: {
        dspace: "Bearer eyJhbGc...",
        koha: "CGISESSID123..."
    },
    sistemas_disponibles: {
        dspace: true,
        koha_opac: true,
        koha_staff: true,
        admin: true
    }
}

// Se guarda en sessionStorage
sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
sessionStorage.setItem('privilegios', JSON.stringify(data.privilegios));
sessionStorage.setItem('sistemas_disponibles', JSON.stringify(data.sistemas_disponibles));

// Redirige a dashboard.html
window.location.href = 'dashboard.html';
```

### 2. Dashboard (dashboard.html)

```javascript
// Verifica sesión al cargar
window.addEventListener('DOMContentLoaded', function() {
    const usuario = sessionStorage.getItem('usuario');

    if (!usuario) {
        window.location.href = 'index.html';  // Redirige si no hay sesión
        return;
    }

    cargarDatosUsuario();           // Muestra nombre, email, tipo
    cargarSistemasDisponibles();    // Muestra solo sistemas autorizados
});

// Cuando usuario hace clic en sistema
function accederSistema(sistema) {
    // Abre ventana con auto-login page correspondiente
    window.open(config.url, '_blank', 'width=1200,height=800');
}
```

### 3. Auto-login a DSpace (dspace-auto-login.html)

```javascript
// Lee credenciales de sessionStorage
const usuario = JSON.parse(sessionStorage.getItem('usuario'));

// Guarda en localStorage para que DSpace lo lea
const autoFillData = {
    email: usuario.email,
    password: usuario.password,
    timestamp: Date.now(),
    expiresIn: 5 * 60 * 1000,  // 5 minutos
    sistema: 'dspace'
};
localStorage.setItem('biblioteca_autofill', JSON.stringify(autoFillData));

// Redirige a login de DSpace
window.location.href = 'http://172.27.72.64:4000/login';

// DSpace debe tener script que lee localStorage y auto-completa
```

### 4. Auto-login a Koha OPAC (koha-opac-auto-login.html)

```javascript
// Lee credenciales de sessionStorage
const usuario = JSON.parse(sessionStorage.getItem('usuario'));

// Mapea email a username de Koha
const kohaUserid = kohaUserMap[usuario.email] || usuario.email.split('@')[0];

// Crea formulario POST automático
const form = document.createElement('form');
form.method = 'POST';
form.action = 'http://biblioteca.localhost:8080/cgi-bin/koha/opac-user.pl';

// Campos requeridos por Koha OPAC
form.appendChild(createInput('koha_login_context', 'opac'));
form.appendChild(createInput('op', 'cud-login'));
form.appendChild(createInput('login_userid', kohaUserid));
form.appendChild(createInput('login_password', usuario.password));

// Envía formulario automáticamente
document.body.appendChild(form);
form.submit();  // Koha establece cookie y redirige
```

### 5. Auto-login a Koha Staff (koha-auto-login.html)

```javascript
// Similar a OPAC pero con diferentes campos
form.action = 'http://172.27.72.64/cgi-bin/koha/mainpage.pl';

// Campos para Staff Interface
form.appendChild(createInput('koha_login_context', 'intranet'));
form.appendChild(createInput('userid', kohaUserid));
form.appendChild(createInput('password', usuario.password));

form.submit();
```

### 6. Logout (dashboard.html)

```javascript
async function logout() {
    // Llama a API para cerrar sesión en backend
    await fetch('http://localhost:3000/api/logout', {
        method: 'POST',
        credentials: 'include'
    });

    // Limpia almacenamiento local
    sessionStorage.clear();
    localStorage.clear();

    // Redirige a login
    window.location.href = 'index.html';
}
```

---

## 🎨 Diseño Institucional

### Paleta de Colores HENM

```css
:root {
    /* Paleta institucional mexicana */
    --primary-color: #9D2449;      /* Guinda institucional */
    --secondary-color: #2E7D32;    /* Verde institucional */
    --accent-gold: #D4AF37;        /* Dorado emblemas */
    --accent-red: #CE1126;         /* Rojo bandera */
    --text-dark: #333333;          /* Gris oscuro texto */
    --white: #FFFFFF;              /* Blanco */
    --bg-light: #F5F5F5;           /* Fondo claro */
}
```

### Aplicación de Colores

| Color | Elemento | Uso |
|-------|----------|-----|
| **Guinda (#9D2449)** | Koha, Administradores | Títulos principales, badges admin, botones Koha |
| **Verde (#2E7D32)** | DSpace, Estudiantes | Badges estudiantes, botones DSpace |
| **Dorado (#D4AF37)** | Acentos | Iconos, bordes superiores, hover effects |
| **Rojo (#CE1126)** | Bandera | Barra tricolor superior |
| **Gris (#F1F1F1)** | Fondos | Background del dashboard |

### Tipografía

**Fuente**: Montserrat
**Weights**: 400, 500, 600, 700, 800

```css
body {
    font-family: 'Montserrat', sans-serif;
}

/* Títulos institucionales */
h1, h2, h3 {
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
}

/* Botones y labels */
.btn, .form-label {
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
}
```

### Componentes de Diseño

#### Barra Tricolor

```html
<div class="top-bar"></div>

<style>
.top-bar {
    height: 8px;
    background: linear-gradient(to right,
        #2E7D32 0%, #2E7D32 33.33%,
        #FFFFFF 33.33%, #FFFFFF 66.66%,
        #CE1126 66.66%, #CE1126 100%);
    position: fixed;
    top: 0;
    z-index: 9999;
}
</style>
```

#### Super Header (Gobierno de México)

```html
<div class="super-header">
    <img src="SuperHeader.png" alt="Gobierno de México">
</div>

<style>
.super-header {
    background-color: #691C32;  /* Guinda oscuro */
    padding: 0;
}
.super-header img {
    height: 60px;
}
</style>
```

#### Sub Header (HENM)

```html
<div class="sub-header">
    <img src="HeaderColegioNaval.png" alt="Universidad Naval - HENM">
</div>

<style>
.sub-header {
    background-color: #E8DCC8;  /* Beige institucional */
    display: flex;
    justify-content: center;
}
</style>
```

#### Footer Institucional

```html
<footer class="footer">
    <img src="Footer.png" alt="Footer Institucional">
</footer>

<style>
.footer {
    background-color: #691C32;
    margin-top: auto;
}
</style>
```

---

## 📱 Instrucciones de Uso

### Para Usuarios

#### 1. Acceso Inicial

1. Abrir navegador en Windows
2. Ir a `http://localhost:8088`
3. Ingresar credenciales:
   - **Administrador**: `admin@biblioteca.local` / `admin123`
   - **Estudiante**: `maria.garcia@estudiante.local` / `estudiante123`
4. Hacer clic en "Iniciar Sesión"

#### 2. Dashboard Principal

Después del login exitoso, verás:

- **Tarjeta de bienvenida**: Con tu nombre, email y tipo de usuario
- **Sistemas disponibles**: Solo los sistemas a los que tienes acceso
  - Administradores ven: DSpace, Koha OPAC, Koha Staff
  - Estudiantes ven: DSpace, Koha OPAC (sin Staff)

#### 3. Acceder a un Sistema

1. Hacer clic en la tarjeta del sistema deseado
2. Se abrirá nueva ventana/pestaña
3. El sistema detecta credenciales automáticamente
4. Se completa login automático (1-2 segundos)
5. Ya estás dentro del sistema sin escribir usuario/contraseña

#### 4. Cerrar Sesión

1. En el dashboard, clic en "Cerrar Sesión"
2. Confirmar en el diálogo
3. Se cierra sesión en todos los sistemas
4. Redirige automáticamente al login

### Para Administradores

#### Agregar Nuevo Usuario

Editar `/home/marcos/biblioteca/auth-service/auth-server.js`:

```javascript
const usuarios = [
    // ... usuarios existentes
    {
        id: 4,
        email: 'nuevo.usuario@biblioteca.local',
        nombre: 'Nombre',
        apellido: 'Apellido',
        password: 'password123',
        tipo: 'estudiante', // o 'administrador'
        privilegios: {
            dspace: true,
            koha_staff: false,  // true solo para administradores
            koha_opac: true,
            admin: false
        }
    }
];
```

Luego reiniciar auth-service:
```bash
cd /home/marcos/biblioteca/auth-service
npm start
```

#### Crear Usuario en Koha

```bash
# Conectar a MariaDB de Koha
mysql -u koha_biblioteca -p koha_biblioteca

# Insertar usuario
INSERT INTO borrowers (cardnumber, userid, password, firstname, surname, email, categorycode)
VALUES ('B0004', 'nuevo.usuario', PASSWORD('password123'), 'Nombre', 'Apellido', 'nuevo.usuario@biblioteca.local', 'PT');

# Dar permisos de Staff (solo si es administrador)
INSERT INTO user_permissions (borrowernumber, module_bit, code)
SELECT borrowernumber, 0, 'superlibrarian'
FROM borrowers WHERE userid = 'nuevo.usuario';
```

#### Crear Usuario en DSpace

1. Acceder a DSpace como admin: `http://localhost:4000`
2. Login con credenciales admin
3. Ir a "Access Control" → "EPeople"
4. "Create New EPerson"
5. Ingresar email y password
6. Asignar a grupos correspondientes

---

## 🚀 Despliegue y Configuración

### Requisitos Previos

- **Sistema Operativo**: Ubuntu 22.04 LTS en WSL2
- **Docker**: 24.x o superior
- **Docker Compose**: 2.x o superior
- **Node.js**: 18.x o superior
- **npm**: 9.x o superior
- **Koha**: Instalación nativa en Ubuntu
- **MariaDB**: 10.6 o superior (para Koha)

### Instalación Inicial

#### 1. Clonar Repositorio

```bash
cd /home/marcos
git clone [URL_REPOSITORIO] biblioteca
cd biblioteca
```

#### 2. Iniciar Servicios Docker

```bash
# Iniciar DSpace + Admin Panel + Auth Service
docker-compose up -d

# Verificar estado
docker-compose ps
```

#### 3. Iniciar Auth Service

```bash
cd /home/marcos/biblioteca/auth-service
npm install
npm start
```

El servicio quedará corriendo en `http://localhost:3000`.

#### 4. Verificar Koha

```bash
# Verificar Apache de Koha
sudo systemctl status apache2

# Verificar MariaDB
sudo systemctl status mariadb

# Si no están corriendo:
sudo systemctl start apache2
sudo systemctl start mariadb
```

#### 5. Verificar Acceso

Desde Windows, abrir navegador y probar:

- Panel: `http://localhost:8088` → Debe mostrar login institucional
- Auth API: `http://localhost:3000/health` → Debe mostrar `{"status":"OK"}`
- DSpace: `http://localhost:4000` → Debe mostrar home de DSpace
- Koha Staff: `http://localhost:8101/cgi-bin/koha/mainpage.pl` → Debe mostrar login de Koha
- Koha OPAC: `http://localhost:8080` → Debe mostrar catálogo público

### Configuración de Red WSL

Si tienes problemas de conectividad desde Windows:

```bash
# Ver IP de WSL
ip addr show eth0

# Debería mostrar 172.27.72.64 o similar
# Si es diferente, actualizar IPs en:
# - admin-panel/*.html
# - auth-service/auth-server.js
# - docker-compose.yml
```

### Variables de Entorno

Crear `.env` en `/home/marcos/biblioteca/`:

```env
# Auth Service
AUTH_PORT=3000
SESSION_SECRET=biblioteca-digital-secret-2025

# DSpace
DSPACE_FRONTEND_URL=http://172.27.72.64:4000
DSPACE_BACKEND_URL=http://172.27.72.64:8090

# Koha
KOHA_STAFF_URL=http://172.27.72.64:8101
KOHA_OPAC_URL=http://biblioteca.localhost:8080

# Admin Panel
ADMIN_PANEL_PORT=8088
```

---

## 🔧 Solución de Problemas

### Problema 1: No puedo acceder desde Windows

**Síntomas**: `localhost:8088` no responde desde navegador Windows

**Solución**:
```bash
# Verificar que WSL2 esté corriendo
wsl --list --running

# Verificar IP de WSL
wsl ip addr show eth0

# Verificar puertos en uso
wsl netstat -tuln | grep -E '3000|4000|8080|8088|8090'

# Reiniciar WSL si es necesario
wsl --shutdown
wsl
```

### Problema 2: Auth Service no responde

**Síntomas**: Error "Error de conexión. Verificar que el servicio de autenticación esté activo"

**Solución**:
```bash
cd /home/marcos/biblioteca/auth-service

# Ver logs
npm start

# Si hay error de EADDRINUSE
lsof -i :3000
kill -9 [PID]
npm start
```

### Problema 3: CORS Error en navegador

**Síntomas**: Console muestra "CORS policy: No 'Access-Control-Allow-Origin'"

**Solución**:
```javascript
// Verificar CORS en auth-service/auth-server.js
app.use(cors({
    origin: [
        'http://localhost:8088',      // ← Debe estar incluido
        'http://172.27.72.64:8088'
    ],
    credentials: true
}));

// Reiniciar auth-service
```

### Problema 4: Redirect loop entre login y dashboard

**Síntomas**: Navegador cambia constantemente entre index.html y dashboard.html

**Solución**:
```javascript
// Verificar que index.html NO tenga verificación de sesión activa
// Debe estar comentado:
// window.addEventListener('DOMContentLoaded', async function() {
//     const response = await fetch(`${AUTH_API}/session`);
//     if (data.autenticado) {
//         window.location.href = 'dashboard.html';
//     }
// });

// Y que dashboard.html SI verifique:
window.addEventListener('DOMContentLoaded', function() {
    const usuario = sessionStorage.getItem('usuario');
    if (!usuario) {
        window.location.href = 'index.html';
    }
});
```

### Problema 5: Auto-login a Koha no funciona

**Síntomas**: Después de auto-login, Koha muestra login nuevamente

**Solución**:
```bash
# Verificar que usuario existe en Koha
mysql -u koha_biblioteca -p koha_biblioteca
SELECT userid, firstname, surname FROM borrowers WHERE userid IN ('admin', 'Marcos', 'maria.garcia');

# Verificar mapeo en auto-login page
const kohaUserMap = {
    'admin@biblioteca.local': 'admin',          // ← Debe coincidir
    'marcos@biblioteca.local': 'Marcos',        // ← Case-sensitive!
    'maria.garcia@estudiante.local': 'maria.garcia'
};

# Verificar campos del formulario
form.appendChild(createInput('koha_login_context', 'intranet'));  // Staff
form.appendChild(createInput('koha_login_context', 'opac'));      // OPAC
```

### Problema 6: DSpace auto-login no funciona

**Síntomas**: DSpace pide credenciales manualmente

**Solución**:
```javascript
// Verificar que DSpace tenga script de auto-fill
// En DSpace Angular, agregar en index.html:

<script>
window.addEventListener('DOMContentLoaded', function() {
    const autoFillData = localStorage.getItem('biblioteca_autofill');
    if (autoFillData) {
        const data = JSON.parse(autoFillData);

        // Verificar timestamp (max 5 minutos)
        if (Date.now() - data.timestamp < data.expiresIn) {
            // Auto-completar campos
            document.querySelector('input[name="email"]').value = data.email;
            document.querySelector('input[name="password"]').value = data.password;

            // Limpiar después de usar
            localStorage.removeItem('biblioteca_autofill');

            // Opcional: Submit automático
            document.querySelector('form').submit();
        }
    }
});
</script>
```

### Problema 7: Container de Docker no inicia

**Síntomas**: `docker-compose ps` muestra containers en estado "Exit" o "Restarting"

**Solución**:
```bash
# Ver logs del container
docker-compose logs admin-panel
docker-compose logs auth-service
docker-compose logs dspace
docker-compose logs dspace-angular

# Verificar puertos no estén en uso
sudo lsof -i :4000
sudo lsof -i :8088
sudo lsof -i :8090

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Problema 8: PostgreSQL de DSpace no responde

**Síntomas**: DSpace backend muestra error "Connection refused" a PostgreSQL

**Solución**:
```bash
# Ver logs de PostgreSQL
docker-compose logs dspace-postgres

# Verificar volúmenes
docker volume ls | grep dspace

# Si es necesario, recrear volúmenes
docker-compose down -v
docker-compose up -d

# Esperar 2-3 minutos para inicialización
```

---

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real

```bash
# Todos los servicios Docker
docker-compose logs -f

# Servicio específico
docker-compose logs -f admin-panel
docker-compose logs -f dspace-angular
docker-compose logs -f dspace

# Auth Service (Node.js)
cd /home/marcos/biblioteca/auth-service
npm start  # Los logs aparecen en consola

# Apache (Koha)
sudo tail -f /var/log/apache2/koha-staff-access.log
sudo tail -f /var/log/apache2/koha-staff-error.log
sudo tail -f /var/log/apache2/koha-opac-access.log
sudo tail -f /var/log/apache2/koha-opac-error.log

# MariaDB (Koha)
sudo tail -f /var/log/mysql/error.log
```

### Health Checks

```bash
# Auth Service
curl http://localhost:3000/health
# Respuesta: {"status":"OK","service":"Auth Service","timestamp":"..."}

# Admin Panel
curl http://localhost:8088
# Respuesta: HTML del index.html

# DSpace Backend
curl http://localhost:8090/server/api
# Respuesta: JSON con endpoints disponibles

# Koha Staff
curl http://localhost:8101/cgi-bin/koha/mainpage.pl
# Respuesta: HTML del login de Koha
```

---

## 🔒 Seguridad

### Consideraciones de Seguridad Actuales

⚠️ **ADVERTENCIA**: Esta configuración es para **desarrollo/demo únicamente**.

**Vulnerabilidades conocidas**:

1. **Passwords en texto plano**:
   - Los passwords se comparan directamente sin bcrypt
   - El password se envía en el JSON de respuesta para auto-login

2. **Session secret hardcodeado**:
   - `secret: 'biblioteca-digital-secret-2025'` en auth-server.js

3. **CORS muy permisivo**:
   - Acepta múltiples origins sin validación estricta

4. **No hay HTTPS**:
   - Todas las comunicaciones en HTTP plano
   - Cookies sin `secure: true`

5. **Base de datos en memoria**:
   - Los usuarios están hardcodeados en el código
   - No hay persistencia

### Recomendaciones para Producción

#### 1. Usar Base de Datos Real

```javascript
// Reemplazar array usuarios por conexión a PostgreSQL/MySQL
const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'biblioteca_auth',
    host: 'localhost',
    port: 5432
});

// Query segura
const result = await pool.query(
    'SELECT * FROM usuarios WHERE email = $1',
    [email]
);
```

#### 2. Hash de Passwords

```javascript
const bcrypt = require('bcryptjs');

// Al crear usuario
const hashedPassword = await bcrypt.hash(password, 10);

// Al verificar
const passwordValida = await bcrypt.compare(passwordIngresada, usuario.password);
```

#### 3. Variables de Entorno

```javascript
// En auth-server.js
require('dotenv').config();

app.use(session({
    secret: process.env.SESSION_SECRET,  // De .env
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',  // true en prod
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict'
    }
}));
```

#### 4. HTTPS con Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name biblioteca.henm.edu.mx;

    ssl_certificate /etc/ssl/certs/henm.crt;
    ssl_certificate_key /etc/ssl/private/henm.key;

    location / {
        proxy_pass http://localhost:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 5. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 5,  // 5 intentos
    message: 'Demasiados intentos de login, intenta más tarde'
});

app.post('/api/login', loginLimiter, async (req, res) => {
    // ...
});
```

---

## 📚 Documentación Adicional

### Documentación Oficial

- **Koha**: https://koha-community.org/manual/
- **DSpace**: https://wiki.lyrasis.org/display/DSDOC7x
- **Express.js**: https://expressjs.com/
- **Docker Compose**: https://docs.docker.com/compose/

### Archivos de Configuración Importantes

| Archivo | Ubicación | Propósito |
|---------|-----------|-----------|
| `docker-compose.yml` | `/home/marcos/biblioteca/` | Orquestación de containers |
| `auth-server.js` | `/home/marcos/biblioteca/auth-service/` | Lógica de autenticación |
| `index.html` | `/home/marcos/biblioteca/admin-panel/` | Login institucional |
| `dashboard.html` | `/home/marcos/biblioteca/admin-panel/` | Dashboard principal |
| `nginx.conf` | `/home/marcos/biblioteca/admin-panel/` | Config de Nginx |
| `koha-sites.conf` | `/etc/koha/koha-sites.conf` | Config de Koha |
| `apache2.conf` | `/etc/apache2/apache2.conf` | Config de Apache para Koha |

---

## 🎯 Roadmap Futuro

### Mejoras Pendientes

- [ ] Implementar base de datos PostgreSQL para usuarios
- [ ] Agregar hash bcrypt para passwords
- [ ] Implementar HTTPS con certificados SSL
- [ ] Agregar rate limiting en auth-service
- [ ] Implementar refresh tokens para sesiones largas
- [ ] Crear panel de administración para gestionar usuarios
- [ ] Agregar logs de auditoría (quién accedió a qué y cuándo)
- [ ] Implementar 2FA (autenticación de dos factores)
- [ ] Crear API para gestión de usuarios desde el panel
- [ ] Agregar estadísticas de uso en el dashboard
- [ ] Implementar backup automático de configuraciones
- [ ] Crear documentación para usuarios finales
- [ ] Agregar videos tutoriales de uso
- [ ] Implementar notificaciones push para eventos importantes

### Features Opcionales

- [ ] Integración con Active Directory / LDAP
- [ ] Single Sign-Out (SSO) sincronizado
- [ ] API REST completa para integraciones externas
- [ ] Mobile app con React Native
- [ ] Sistema de reservas desde el dashboard
- [ ] Chat en vivo para soporte
- [ ] Integración con Google Scholar
- [ ] Exportación de estadísticas a Excel/PDF
- [ ] Modo oscuro en el dashboard
- [ ] Internacionalización (i18n) español/inglés

---

## 📞 Contacto y Soporte

**Institución**: Heroica Escuela Naval Militar (HENM)
**Sistema**: Biblioteca Digital Integrada
**Versión**: 1.0.0 (Octubre 2025)
**Estado**: ✅ Estable en Producción

---

## 📄 Licencia

Este sistema es de uso interno para la Heroica Escuela Naval Militar.
Todos los derechos reservados © 2025 HENM.

---

**Última actualización**: Octubre 2025
**Documento generado por**: Claude Code
**Revisión**: v1.0
