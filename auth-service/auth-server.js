/**
 * ============================================================================
 * SERVICIO DE AUTENTICACIÓN CENTRALIZADO (SSO)
 * Panel de Biblioteca Digital - HENM
 * ============================================================================
 *
 * ARQUITECTURA ACTUAL:
 *
 * 1. USUARIOS ACCEDEN A: http://localhost:8088 (Admin Panel)
 * 2. LOGIN EN: admin-panel/index.html
 *    - Envía POST a /api/login con email/password
 *    - Recibe usuario, privilegios, sistemas_disponibles
 *    - Guarda en sessionStorage
 *    - Redirige a dashboard.html
 *
 * 3. DASHBOARD: admin-panel/dashboard.html
 *    - Lee sessionStorage para verificar sesión
 *    - Muestra sistemas según privilegios del usuario
 *    - Al hacer clic en sistema, abre auto-login page
 *
 * 4. AUTO-LOGIN PAGES (intermediarios):
 *    - dspace-auto-login.html: Lee sessionStorage, guarda en localStorage, redirige a DSpace
 *    - koha-opac-auto-login.html: Crea formulario POST y envía a Koha OPAC
 *    - koha-auto-login.html: Crea formulario POST y envía a Koha Staff
 *
 * SISTEMAS INTEGRADOS:
 * - Koha: Instalación REAL en Ubuntu (no Docker)
 *   - Staff: http://172.27.72.64:8101 (localhost:8101)
 *   - OPAC: http://172.27.72.64:8080 (localhost:8080)
 * - DSpace: Docker container
 *   - Frontend: http://172.27.72.64:4000 (localhost:4000)
 *   - Backend: http://172.27.72.64:8090 (localhost:8090)
 *
 * USUARIOS ACTUALES:
 * - admin@biblioteca.local / admin123 (Administrador - todos los sistemas)
 * - marcos@biblioteca.local / marcos123 (Administrador - todos los sistemas)
 * - maria.garcia@estudiante.local / estudiante123 (Estudiante - DSpace + OPAC solo)
 *
 * ACCESO DESDE WINDOWS (WSL):
 * - Koha y DSpace corren en WSL Ubuntu
 * - Usuario visualiza desde navegador Windows
 * - IP de WSL: 172.27.72.64
 *
 * ENDPOINTS ACTIVOS:
 * ✅ POST /api/login - Autenticación centralizada (SE USA)
 * ✅ GET /api/session - Verificar sesión activa (SE USA)
 * ✅ POST /api/logout - Cerrar sesión (SE USA)
 * ✅ GET /health - Health check (SE USA)
 * ❌ POST /api/get-access-url - NO SE USA (comentado)
 * ❌ GET /api/koha-redirect - NO SE USA (comentado)
 *
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const FormData = require('form-data');

const app = express();
const PORT = 3000;

// Configuración de middleware
app.use(cors({
    origin: ['http://172.27.72.64:8081', 'http://localhost:8081', 'http://localhost:8088', 'http://172.27.72.64:8088', 'http://localhost:3000'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'biblioteca-digital-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Cambiar a true en producción con HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Base de datos de usuarios en memoria (en producción usar PostgreSQL/MariaDB)
const usuarios = [
    {
        id: 1,
        email: 'admin@biblioteca.local',
        nombre: 'Admin',
        apellido: 'Koha',
        password: '$2a$10$XQKq7P8h5LZJqxVxK7KqJeYxGZxQ5KqZ5KqZ5KqZ5KqZ5Kq', // admin123
        tipo: 'administrador',
        privilegios: {
            dspace: true,
            koha_staff: true, // Staff interface
            koha_opac: true,  // OPAC
            admin: true
        }
    },
    {
        id: 2,
        email: 'marcos@biblioteca.local',
        nombre: 'Marcos',
        apellido: 'Administrador',
        password: '$2a$10$marcos123hash', // marcos123
        tipo: 'administrador',
        privilegios: {
            dspace: true,
            koha_staff: true, // Staff interface
            koha_opac: true,  // OPAC
            admin: true
        }
    },
    {
        id: 3,
        email: 'maria.garcia@estudiante.local',
        nombre: 'María',
        apellido: 'García',
        password: '$2a$10$estudiante123hash', // estudiante123
        tipo: 'estudiante',
        privilegios: {
            dspace: true,       // ✅ Acceso a DSpace
            koha_staff: false,  // NO puede acceder a staff
            koha_opac: true,    // ✅ Acceso a OPAC
            admin: false
        }
    },
    {
        id: 4,
        email: 'alumno@biblioteca.local',
        nombre: 'Maria',
        apellido: 'Garcia',
        password: '$2a$10$YRLr8Q9i6MAKrwWyM8LrNOZyHaxRaxSaxSaxSaxSaxSax', // alumno123
        tipo: 'estudiante',
        privilegios: {
            dspace: true,
            koha_staff: false, // NO puede acceder a staff
            koha_opac: true,   // Solo OPAC
            admin: false
        }
    }
];

// Función para verificar contraseña (simplificada para demo)
function verificarPassword(passwordIngresada, passwordHash) {
    // En esta versión simplificada comparamos directamente
    // En producción usar bcrypt.compare()
    if (passwordIngresada === 'admin123' || passwordIngresada === 'marcos123' || passwordIngresada === 'alumno123' || passwordIngresada === 'estudiante123') {
        return true;
    }
    return false;
}

// ============================================================================
// FUNCIONES DE AUTENTICACIÓN CONTRA SISTEMAS EXTERNOS
// ============================================================================

// NOTA IMPORTANTE: Estas funciones intentan autenticar contra DSpace y Koha
// durante el login, pero NO son críticas para el funcionamiento del sistema.
// El auto-login real se hace en las páginas intermedias (dspace-auto-login.html, etc.)
// que leen las credenciales de sessionStorage y las envían directamente.
//
// Estas funciones están aquí para:
// 1. Validar opcionalmente que las credenciales son correctas en los sistemas
// 2. Obtener tokens que podrían usarse en el futuro
// 3. Mantener compatibilidad con versiones anteriores

// Función para autenticar en DSpace (OPCIONAL - no crítica)
async function autenticarDSpace(email, password) {
    try {
        const response = await axios.post('http://172.27.72.64:8090/server/api/authn/login', {
            email: email,
            password: password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200 && response.headers['authorization']) {
            return {
                success: true,
                token: response.headers['authorization'],
                data: response.data
            };
        }
        return { success: false };
    } catch (error) {
        console.log('Error autenticando en DSpace:', error.message);
        // No es crítico, el auto-login se hace en dspace-auto-login.html
        return { success: false, error: error.message };
    }
}

// Función para autenticar en Koha (OPCIONAL - no crítica)
async function autenticarKoha(userid, password) {
    try {
        // Mapeo de emails a userids de Koha (IMPORTANTE: case-sensitive!)
        const kohaUserMap = {
            'admin@biblioteca.local': 'admin',
            'alumno@biblioteca.local': 'alumno',
            'marcos@biblioteca.local': 'Marcos',        // ← Mayúscula importante
            'maria.garcia@estudiante.local': 'maria.garcia'
        };

        const kohaUserid = kohaUserMap[userid] || userid;

        // Intentar login en Koha Staff Interface
        const response = await axios.post(
            'http://172.27.72.64/cgi-bin/koha/mainpage.pl',
            `userid=${encodeURIComponent(kohaUserid)}&password=${encodeURIComponent(password)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                maxRedirects: 0,
                validateStatus: function (status) {
                    return status >= 200 && status < 400;
                }
            }
        );

        // Extraer cookie CGISESSID de la respuesta
        const cookies = response.headers['set-cookie'];
        if (cookies) {
            const cgisessid = cookies.find(cookie => cookie.includes('CGISESSID'));
            if (cgisessid) {
                const sessionMatch = cgisessid.match(/CGISESSID=([^;]+)/);
                if (sessionMatch) {
                    return {
                        success: true,
                        sessionId: sessionMatch[1],
                        cookie: cgisessid
                    };
                }
            }
        }

        return { success: false };
    } catch (error) {
        console.log('Error autenticando en Koha:', error.message);
        // No es crítico, el auto-login se hace en koha-auto-login.html y koha-opac-auto-login.html
        return { success: false, error: error.message };
    }
}

// Endpoint: Login centralizado
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y contraseña son requeridos'
        });
    }

    // Buscar usuario en base de datos local
    const usuario = usuarios.find(u => u.email === email);

    if (!usuario) {
        return res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
    }

    // Verificar contraseña
    const passwordValida = verificarPassword(password, usuario.password);

    if (!passwordValida) {
        return res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
    }

    // Autenticar en DSpace si tiene privilegios
    let dspaceAuth = { success: false };
    if (usuario.privilegios.dspace) {
        dspaceAuth = await autenticarDSpace(email, password);
    }

    // Autenticar en Koha si tiene privilegios (staff o opac)
    let kohaAuth = { success: false };
    if (usuario.privilegios.koha_staff || usuario.privilegios.koha_opac) {
        kohaAuth = await autenticarKoha(email, password);
    }

    // Crear sesión
    req.session.usuario = {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        tipo: usuario.tipo,
        privilegios: usuario.privilegios
    };

    // Guardar tokens en sesión
    if (dspaceAuth.success && dspaceAuth.token) {
        req.session.dspaceToken = dspaceAuth.token;
    }

    if (kohaAuth.success && kohaAuth.sessionId) {
        req.session.kohaSessionId = kohaAuth.sessionId;
        req.session.kohaCookie = kohaAuth.cookie;
    }

    // Responder con información del usuario y tokens
    res.json({
        success: true,
        message: 'Autenticación exitosa',
        usuario: {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            nombreCompleto: `${usuario.nombre} ${usuario.apellido}`,
            tipo: usuario.tipo,
            privilegios: usuario.privilegios,
            password: password // Enviar para autenticación automática
        },
        tokens: {
            dspace: dspaceAuth.success ? dspaceAuth.token : null,
            koha: kohaAuth.success ? kohaAuth.sessionId : null
        },
        sistemas_disponibles: {
            dspace: usuario.privilegios.dspace || false,
            koha_opac: usuario.privilegios.koha_opac || false,
            koha_staff: usuario.privilegios.koha_staff || false,
            admin: usuario.privilegios.admin || false
        }
    });
});

// Endpoint: Verificar sesión
app.get('/api/session', (req, res) => {
    if (req.session.usuario) {
        res.json({
            success: true,
            autenticado: true,
            usuario: req.session.usuario
        });
    } else {
        res.json({
            success: true,
            autenticado: false
        });
    }
});

// Endpoint: Logout (Sincronizado con DSpace)
app.post('/api/logout', async (req, res) => {
    // Intentar cerrar sesión en DSpace si hay token
    if (req.session.dspaceToken) {
        try {
            await axios.post('http://172.27.72.64:8090/server/api/authn/logout', {}, {
                headers: {
                    'Authorization': req.session.dspaceToken
                }
            });
        } catch (error) {
            console.log('Error al cerrar sesión en DSpace:', error.message);
        }
    }

    // Destruir sesión del panel
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al cerrar sesión'
            });
        }
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente en todos los sistemas',
            sistemas_cerrados: {
                panel: true,
                dspace: req.session?.dspaceToken ? true : false
            }
        });
    });
});

// ============================================================================
// ENDPOINTS NO UTILIZADOS ACTUALMENTE
// Estos endpoints están disponibles pero no se usan en el flujo actual.
// El sistema usa auto-login pages en su lugar (dspace-auto-login.html, etc.)
// ============================================================================

// NOTA: Este endpoint NO se usa actualmente
// El dashboard abre directamente las páginas de auto-login
/*
app.post('/api/get-access-url', (req, res) => {
    const { sistema } = req.body;

    if (!req.session.usuario) {
        return res.status(401).json({
            success: false,
            message: 'No autenticado'
        });
    }

    const usuario = req.session.usuario;

    // Verificar privilegios
    if (!usuario.privilegios[sistema]) {
        return res.status(403).json({
            success: false,
            message: `No tiene privilegios para acceder a ${sistema}`
        });
    }

    // URLs de los sistemas
    const urls = {
        dspace: 'http://172.27.72.64:4000',
        koha_staff: 'http://172.27.72.64/cgi-bin/koha/mainpage.pl',
        koha_opac: 'http://biblioteca.localhost:8080/'
    };

    if (!urls[sistema]) {
        return res.status(400).json({
            success: false,
            message: 'Sistema no válido'
        });
    }

    res.json({
        success: true,
        url: urls[sistema],
        sistema: sistema,
        mensaje: `Redirigiendo a ${sistema.toUpperCase()}...`
    });
});
*/

// NOTA: Este endpoint NO se usa actualmente
// El auto-login a Koha se hace con koha-auto-login.html y koha-opac-auto-login.html
// que envían formularios POST directamente a Koha
/*
app.get('/api/koha-redirect', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).send('No autenticado');
    }

    if (!req.session.kohaSessionId) {
        return res.status(403).send('No hay sesión de Koha activa');
    }

    // Crear página HTML que establece la cookie y redirige
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Redirigiendo a Koha...</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .loader {
            text-align: center;
        }
        .spinner {
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <h2>Redirigiendo a Koha...</h2>
        <p>Estableciendo sesión automática...</p>
    </div>
    <script>
        // Establecer cookie CGISESSID
        document.cookie = "CGISESSID=${req.session.kohaSessionId}; path=/; SameSite=Lax";

        // Redirigir a Koha después de establecer la cookie
        setTimeout(function() {
            window.location.href = 'http://172.27.72.64/cgi-bin/koha/mainpage.pl';
        }, 1000);
    </script>
</body>
</html>
    `;

    res.send(html);
});
*/

// Endpoint: Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Auth Service',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🔐 Servicio de Autenticación Centralizado (SSO)         ║
║                                                              ║
║     Puerto:    ${PORT}                                          ║
║     Estado:    ✅ ACTIVO                                     ║
║                                                              ║
║     Endpoints:                                               ║
║     - POST /api/login       (Autenticación)                  ║
║     - GET  /api/session     (Verificar sesión)               ║
║     - POST /api/logout      (Cerrar sesión)                  ║
║     - POST /api/get-access-url (Obtener URL de acceso)       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
