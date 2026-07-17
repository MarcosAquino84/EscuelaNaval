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

// Base del API de DSpace (contenedor en la red de Docker; ver docker-compose)
const DSPACE_API = process.env.DSPACE_API_URL || 'http://dspace:8080/server/api';
const bcrypt = require('bcryptjs');
const FormData = require('form-data');
const rateLimit = require('express-rate-limit');

// Importar módulos de base de datos y rutas
const { verificarConexion, query } = require('./db');
const citasRoutes = require('./citas-routes');

const app = express();
const PORT = 3000;

// El servicio vive detrás del proxy nginx del panel (y de ngrok): hay que
// confiar en la red interna de Docker para que Express resuelva la IP real
// del cliente desde X-Forwarded-For. Sin esto, express-rate-limit lanza
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR y el login truena con 500.
app.set('trust proxy', ['loopback', '172.16.0.0/12']);

// Configuración de middleware
// Lista de orígenes permitidos (CORS)
const allowedOrigins = [
    'http://localhost:8088',
    'http://localhost:4000',
    'http://localhost:8082',
    'http://localhost:8101',
    'https://pouch-earwig-boxy.ngrok-free.dev'
];
// URL pública adicional (ngrok) configurable sin tocar código
if (process.env.PUBLIC_URL) {
    allowedOrigins.push(process.env.PUBLIC_URL);
}

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (como desde Postman o curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Acceso no permitido por política CORS'));
        }
    },
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============================================================================
// SECURITY HEADERS - Protección adicional
// ============================================================================
app.use((req, res, next) => {
    // Prevenir clickjacking - solo permitir frames del mismo origen
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Prevenir MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Habilitar protección XSS del navegador
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Controlar información del referer
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Deshabilitar funcionalidades peligrosas del navegador
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true en producción con HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        sameSite: 'lax' // Protección adicional contra CSRF
    }
}));

// ============================================================================
// RATE LIMITING - Protección contra ataques de fuerza bruta
// ============================================================================

// Rate limiter general para todas las rutas API
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP cada 15 minutos
    message: 'Demasiadas solicitudes desde esta IP, intenta más tarde',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter estricto para login (prevenir brute force)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Solo 5 intentos de login cada 15 minutos
    skipSuccessfulRequests: true, // No contar logins exitosos
    // Objeto => se envía como JSON; con texto plano el frontend no podía
    // parsearlo y mostraba "Error de conexión" en lugar del aviso real
    message: { success: false, message: 'Demasiados intentos de login fallidos. Espera 15 minutos e intenta de nuevo.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter para password reset (prevenir abuso)
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // Solo 3 solicitudes por hora
    message: 'Demasiadas solicitudes de recuperación de contraseña, intenta en 1 hora',
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicar rate limiter general a todas las rutas API
app.use('/api/', generalLimiter);

// Integrar rutas del módulo de orientación educativa (citas)
app.use('/api', citasRoutes);

// ============================================================================
// HELPER: Mapear privilegios desde base de datos
// ============================================================================
function mapearPrivilegios(usuarioDB) {
    // Los privilegios se almacenan como columnas booleanas en la BD
    return {
        dspace: usuarioDB.priv_dspace || false,
        koha_staff: usuarioDB.priv_koha_staff || false,
        koha_opac: usuarioDB.priv_koha_opac || false,
        admin: usuarioDB.priv_admin || false
    };
}

// ============================================================================
// HELPER: Validar contraseña fuerte
// ============================================================================
function validarPasswordFuerte(password) {
    // Política de contraseñas:
    // - Mínimo 12 caracteres
    // - Al menos una mayúscula
    // - Al menos una minúscula
    // - Al menos un número
    // - Al menos un carácter especial

    const errors = [];

    if (password.length < 12) {
        errors.push('mínimo 12 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('al menos una mayúscula');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('al menos una minúscula');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('al menos un número');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push('al menos un carácter especial (!@#$%^&*...)');
    }

    return {
        valid: errors.length === 0,
        errors: errors,
        message: errors.length > 0
            ? `La contraseña debe tener: ${errors.join(', ')}`
            : 'Contraseña válida'
    };
}

// ============================================================================
// SISTEMA DE AUDITORÍA
// ============================================================================
async function registrarAuditoria(params) {
    const {
        usuario_id = null,
        email = null,
        accion,
        entidad = null,
        entidad_id = null,
        detalles = null,
        ip_address = null,
        user_agent = null,
        resultado = 'success'
    } = params;

    try {
        await query(
            `INSERT INTO audit_log
             (usuario_id, email, accion, entidad, entidad_id, detalles, ip_address, user_agent, resultado)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                usuario_id,
                email,
                accion,
                entidad,
                entidad_id,
                detalles ? JSON.stringify(detalles) : null,
                ip_address,
                user_agent,
                resultado
            ]
        );
    } catch (error) {
        // No fallar si la auditoría falla, solo registrar error
        console.error('Error al registrar auditoría:', error.message);
    }
}

// Helper para obtener IP del request
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           null;
}

// ============================================================================
// AUTENTICACIÓN: Verificar contraseña con bcrypt
// ============================================================================
async function verificarPassword(passwordIngresada, passwordHash) {
    try {
        return await bcrypt.compare(passwordIngresada, passwordHash);
    } catch (error) {
        console.error('Error al verificar contraseña:', error);
        return false;
    }
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
        const dspaceApi = process.env.DSPACE_API_URL || 'http://dspace:8080/server/api';
        const response = await axios.post(`${dspaceApi}/authn/login`, {
            email: email,
            password: password
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000 // llamada opcional: no debe bloquear el login
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
        const kohaStaffUrl = process.env.KOHA_STAFF_URL || 'http://koha:8081';
        const response = await axios.post(
            `${kohaStaffUrl}/cgi-bin/koha/mainpage.pl`,
            `userid=${encodeURIComponent(kohaUserid)}&password=${encodeURIComponent(password)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                maxRedirects: 0,
                timeout: 5000, // llamada opcional: no debe bloquear el login
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

// ============================================================================
// FUNCIONES DE SINCRONIZACIÓN DE USUARIOS CON SISTEMAS EXTERNOS
// ============================================================================

/**
 * Sesión de administrador contra el API de DSpace, con manejo correcto de
 * la rotación del token CSRF (DSpace 7 lo cambia en el login y puede
 * rotarlo en cualquier respuesta; el header X-XSRF-TOKEN debe coincidir
 * siempre con la cookie DSPACE-XSRF-COOKIE vigente).
 */
async function sesionAdminDSpace() {
    const s = { csrf: null, cookie: '', bearer: null };

    s.refrescar = (headers) => {
        if (!headers) return;
        if (headers['dspace-xsrf-token']) s.csrf = headers['dspace-xsrf-token'];
        const sc = (headers['set-cookie'] || []).map(c => c.split(';')[0]);
        if (sc.length) {
            const mapa = Object.fromEntries(s.cookie.split('; ').filter(Boolean).map(p => p.split('=')));
            // Un Set-Cookie con valor vacío es un BORRADO (DSpace limpia la
            // cookie XSRF en el login): no debe pisar el token vigente
            for (const c of sc) {
                const [k, v] = c.split('=');
                if (v) mapa[k] = v; else delete mapa[k];
            }
            s.cookie = Object.entries(mapa).map(([k, v]) => `${k}=${v}`).join('; ');
            const xsrf = sc.find(c => c.startsWith('DSPACE-XSRF-COOKIE='));
            const val = xsrf ? xsrf.split('=')[1] : '';
            if (val) s.csrf = val;
        }
    };

    s.headers = () => {
        // DSpace valida que el header X-XSRF-TOKEN coincida con la cookie:
        // garantizar que la cookie lleve siempre el token vigente
        const mapa = Object.fromEntries(s.cookie.split('; ').filter(Boolean).map(p => p.split('=')));
        if (s.csrf) mapa['DSPACE-XSRF-COOKIE'] = s.csrf;
        return {
            'Authorization': s.bearer,
            'X-XSRF-TOKEN': s.csrf,
            'Cookie': Object.entries(mapa).map(([k, v]) => `${k}=${v}`).join('; '),
            'Content-Type': 'application/json'
        };
    };

    const status = await axios.get(`${DSPACE_API}/authn/status`, { timeout: 8000 });
    s.refrescar(status.headers);

    // El login espera parámetros de formulario (user/password), no JSON
    const login = await axios.post(`${DSPACE_API}/authn/login`,
        new URLSearchParams({
            user: process.env.DSPACE_ADMIN_EMAIL || 'admin@biblioteca.local',
            password: process.env.DSPACE_ADMIN_PASSWORD || 'admin123'
        }),
        { headers: { 'X-XSRF-TOKEN': s.csrf, 'Cookie': s.cookie }, timeout: 8000 });

    s.bearer = login.headers['authorization'];
    s.refrescar(login.headers);
    if (!s.bearer) throw new Error('No se pudo autenticar como admin en DSpace');
    return s;
}

/**
 * Crear usuario en DSpace mediante API REST
 * @returns {Promise<{success: boolean, userId?: string, error?: string}>}
 */
async function crearUsuarioDSpace(email, password, nombre, apellido) {
    try {
        const s = await sesionAdminDSpace();
        const cuerpo = {
            email: email,
            password: password,
            canLogIn: true,
            requireCertificate: false,
            metadata: {
                'eperson.firstname': [{ value: nombre }],
                'eperson.lastname': [{ value: apellido }]
            }
        };

        // Reintentar una vez si el token CSRF rotó (403)
        for (let intento = 1; intento <= 2; intento++) {
            try {
                const r = await axios.post(`${DSPACE_API}/eperson/epersons`, cuerpo,
                    { headers: s.headers(), timeout: 8000 });
                const userId = r.data?.id || r.data?.uuid;
                console.log(`✅ Usuario creado en DSpace: ${email} (ID: ${userId})`);
                return { success: true, userId };
            } catch (e) {
                s.refrescar(e.response?.headers);
                if (e.response?.status === 422 || e.response?.status === 409) {
                    console.log(`⚠️ Usuario ya existe en DSpace: ${email}`);
                    return { success: true, userId: null };
                }
                if (!(e.response?.status === 403 && intento === 1)) throw e;
            }
        }
    } catch (error) {
        console.error(`❌ Error al crear usuario en DSpace (${email}):`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Crear usuario en Koha mediante API REST o acceso directo a BD
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @param {string} nombre - Nombre del usuario
 * @param {string} apellido - Apellido del usuario
 * @param {boolean} isStaff - Si el usuario tiene privilegios staff
 * @returns {Promise<{success: boolean, borrowernumber?: number, error?: string}>}
 */
async function crearUsuarioKoha(email, password, nombre, apellido, isStaff = false, tipo = 'estudiante') {
    try {
        const KOHA_REST = (process.env.KOHA_STAFF_URL || 'http://koha:8081') + '/api/v1';
        const kohaAuth = {
            username: process.env.KOHA_ADMIN_USER || 'admin',
            password: process.env.KOHA_ADMIN_PASSWORD || 'admin123'
        };

        // userid = parte local del email: es la convención que usa el
        // auto-login del panel cuando el correo no está en el mapa
        const userid = email.split('@')[0];
        const cardnumber = `USR${Date.now().toString().slice(-8)}`;
        // Categoría de Koha según el rol: administrador/staff => S(taff),
        // orientador/asesor => T(eacher), estudiante => ST(udent)
        const categoria = isStaff ? 'S' : (tipo === 'orientador' ? 'T' : 'ST');

        // ¿Ya existe? (idempotencia)
        const existente = await axios.get(
            `${KOHA_REST}/patrons?userid=${encodeURIComponent(userid)}`,
            { auth: kohaAuth, timeout: 8000 });
        let patronId = Array.isArray(existente.data) ? existente.data[0]?.patron_id : null;

        if (!patronId) {
            const alta = await axios.post(`${KOHA_REST}/patrons`, {
                userid: userid,
                cardnumber: cardnumber,
                surname: apellido,
                firstname: nombre,
                email: email,
                library_id: 'MAIN',
                category_id: categoria
            }, { auth: kohaAuth, timeout: 8000 });
            patronId = alta.data.patron_id;
            console.log(`✅ Usuario creado en Koha: ${email} (patron ${patronId}, ${categoria})`);
        } else {
            console.log(`⚠️ Usuario ya existía en Koha: ${email} (patron ${patronId})`);
        }

        // Misma contraseña que el panel, para que funcione el auto-login.
        // El endpoint es POST; reintentar ante 404 (el patrón recién creado
        // puede no estar disponible en el instante siguiente).
        for (let intento = 1; intento <= 3; intento++) {
            try {
                await axios.post(`${KOHA_REST}/patrons/${patronId}/password`, {
                    password: password,
                    password_2: password
                }, { auth: kohaAuth, timeout: 8000 });
                break;
            } catch (e) {
                if (e.response?.status === 404 && intento < 3) {
                    await new Promise(r => setTimeout(r, 400));
                    continue;
                }
                throw e;
            }
        }

        return { success: true, borrowernumber: patronId, userid: userid };

    } catch (error) {
        const detalle = JSON.stringify(error.response?.data || '').substring(0, 150);
        console.error(`❌ Error al crear usuario en Koha (${email}):`, error.message, detalle);

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Actualizar contraseña del usuario en DSpace
 * @param {string} email - Email del usuario
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function actualizarPasswordDSpace(email, newPassword) {
    try {
        const s = await sesionAdminDSpace();

        // Buscar el usuario por email
        const searchResponse = await axios.get(
            `${DSPACE_API}/eperson/epersons/search/byEmail?email=${encodeURIComponent(email)}`,
            { headers: s.headers(), timeout: 8000 }
        );
        s.refrescar(searchResponse.headers);

        const userId = searchResponse.data?.id || searchResponse.data?.uuid;
        if (!userId) {
            console.log(`⚠️ Usuario no encontrado en DSpace: ${email}`);
            return { success: false, error: 'Usuario no encontrado' };
        }

        // Actualizar contraseña (JSON Patch; reintenta una vez si el CSRF rotó)
        const patch = [{ op: 'add', path: '/password', value: { new_password: newPassword } }];
        for (let intento = 1; intento <= 2; intento++) {
            try {
                await axios.patch(`${DSPACE_API}/eperson/epersons/${userId}`, patch,
                    { headers: s.headers(), timeout: 8000 });
                console.log(`✅ Contraseña actualizada en DSpace: ${email}`);
                return { success: true };
            } catch (e) {
                s.refrescar(e.response?.headers);
                if (!(e.response?.status === 403 && intento === 1)) throw e;
            }
        }

    } catch (error) {
        console.error(`❌ Error al actualizar contraseña en DSpace (${email}):`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Actualizar contraseña del usuario en Koha
 * @param {string} email - Email del usuario
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function actualizarPasswordKoha(email, newPassword) {
    try {
        const KOHA_REST = (process.env.KOHA_STAFF_URL || 'http://koha:8081') + '/api/v1';
        const kohaAuth = {
            username: process.env.KOHA_ADMIN_USER || 'admin',
            password: process.env.KOHA_ADMIN_PASSWORD || 'admin123'
        };

        const r = await axios.get(
            `${KOHA_REST}/patrons?email=${encodeURIComponent(email)}`,
            { auth: kohaAuth, timeout: 8000 });
        const patronId = Array.isArray(r.data) ? r.data[0]?.patron_id : null;
        if (!patronId) {
            console.log(`⚠️ Usuario no encontrado en Koha: ${email}`);
            return { success: false, error: 'Usuario no encontrado en Koha' };
        }

        await axios.post(`${KOHA_REST}/patrons/${patronId}/password`, {
            password: newPassword,
            password_2: newPassword
        }, { auth: kohaAuth, timeout: 8000 });

        console.log(`✅ Contraseña actualizada en Koha: ${email}`);
        return { success: true };

    } catch (error) {
        console.error(`❌ Error al actualizar contraseña en Koha (${email}):`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Endpoint: Login centralizado (con rate limiting estricto)
app.post('/api/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y contraseña son requeridos'
        });
    }

    try {
        // Buscar usuario en PostgreSQL
        const result = await query(
            'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
            [email]
        );

        // Hash dummy para prevenir timing attacks
        // Siempre ejecutamos bcrypt.compare incluso si el usuario no existe
        const dummyHash = '$2b$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234';
        const passwordHash = result.rows.length > 0 ? result.rows[0].password_hash : dummyHash;

        // SIEMPRE ejecutar bcrypt.compare (tiempo constante)
        const passwordValida = await bcrypt.compare(password, passwordHash);

        // Verificar si usuario existe Y contraseña es válida
        if (result.rows.length === 0 || !passwordValida) {
            // Registrar intento de login fallido
            await registrarAuditoria({
                email: email,
                accion: 'login_failed',
                entidad: 'session',
                detalles: { reason: 'invalid_credentials' },
                ip_address: getClientIP(req),
                user_agent: req.headers['user-agent'],
                resultado: 'failure'
            });

            // Mismo mensaje en ambos casos (prevenir enumeración de usuarios)
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const usuarioDB = result.rows[0];

        // Mapear privilegios desde BD
        const privilegios = mapearPrivilegios(usuarioDB);

        // Autenticar en DSpace si tiene privilegios
        let dspaceAuth = { success: false };
        if (privilegios.dspace) {
            dspaceAuth = await autenticarDSpace(email, password);
        }

        // Autenticar en Koha si tiene privilegios (staff o opac)
        let kohaAuth = { success: false };
        if (privilegios.koha_staff || privilegios.koha_opac) {
            kohaAuth = await autenticarKoha(email, password);
        }

        // Crear sesión
        req.session.usuario = {
            id: usuarioDB.id,
            email: usuarioDB.email,
            nombre: usuarioDB.nombre,
            apellido: usuarioDB.apellido,
            tipo: usuarioDB.tipo,
            privilegios: privilegios
        };

        // Guardar tokens en sesión
        if (dspaceAuth.success && dspaceAuth.token) {
            req.session.dspaceToken = dspaceAuth.token;
        }

        if (kohaAuth.success && kohaAuth.sessionId) {
            req.session.kohaSessionId = kohaAuth.sessionId;
            req.session.kohaCookie = kohaAuth.cookie;
        }

        // Actualizar último acceso
        await query(
            'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1',
            [usuarioDB.id]
        );

        // Registrar login exitoso
        await registrarAuditoria({
            usuario_id: usuarioDB.id,
            email: usuarioDB.email,
            accion: 'login',
            entidad: 'session',
            detalles: {
                tipo: usuarioDB.tipo,
                sistemas: {
                    dspace: privilegios.dspace,
                    koha_staff: privilegios.koha_staff,
                    koha_opac: privilegios.koha_opac
                }
            },
            ip_address: getClientIP(req),
            user_agent: req.headers['user-agent'],
            resultado: 'success'
        });

        // Responder con información del usuario y tokens
        res.json({
            success: true,
            message: 'Autenticación exitosa',
            usuario: {
                id: usuarioDB.id,
                email: usuarioDB.email,
                nombre: usuarioDB.nombre,
                apellido: usuarioDB.apellido,
                nombreCompleto: `${usuarioDB.nombre} ${usuarioDB.apellido}`,
                tipo: usuarioDB.tipo,
                privilegios: privilegios,
                especialidad: usuarioDB.especialidad || null
            },
            tokens: {
                dspace: dspaceAuth.success ? dspaceAuth.token : null,
                koha: kohaAuth.success ? kohaAuth.sessionId : null
            },
            sistemas_disponibles: {
                dspace: privilegios.dspace || false,
                koha_opac: privilegios.koha_opac || false,
                koha_staff: privilegios.koha_staff || false,
                admin: privilegios.admin || false
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
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
    const usuario = req.session.usuario;

    // Intentar cerrar sesión en DSpace si hay token
    if (req.session.dspaceToken) {
        try {
            const dspaceApi = process.env.DSPACE_API_URL || 'http://dspace:8080/server/api';
            await axios.post(`${dspaceApi}/authn/logout`, {}, {
                headers: {
                    'Authorization': req.session.dspaceToken
                },
                timeout: 5000
            });
        } catch (error) {
            console.log('Error al cerrar sesión en DSpace:', error.message);
        }
    }

    // Registrar logout
    if (usuario) {
        await registrarAuditoria({
            usuario_id: usuario.id,
            email: usuario.email,
            accion: 'logout',
            entidad: 'session',
            ip_address: getClientIP(req),
            user_agent: req.headers['user-agent'],
            resultado: 'success'
        });
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
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================================================

// Middleware para verificar que el usuario esté autenticado
function verificarAutenticacion(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({
            success: false,
            message: 'No autenticado. Debe iniciar sesión.'
        });
    }
    next();
}

// Middleware para verificar que el usuario sea administrador
function verificarAdmin(req, res, next) {
    if (!req.session.usuario || !req.session.usuario.privilegios.admin) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos de administrador'
        });
    }
    next();
}

// ============================================================================
// ENDPOINTS DE ADMINISTRACIÓN DE USUARIOS (CRUD)
// ============================================================================

// GET /api/usuarios - Listar todos los usuarios (solo admin)
app.get('/api/usuarios', verificarAutenticacion, verificarAdmin, async (req, res) => {
    try {
        const result = await query(
            `SELECT id, email, nombre, apellido, tipo, especialidad, telefono, biografia, activo, created_at, ultimo_acceso,
             priv_dspace, priv_koha_staff, priv_koha_opac, priv_admin
             FROM usuarios
             ORDER BY tipo, nombre`
        );

        // Mapear privilegios para cada usuario
        const usuarios = result.rows.map(u => ({
            id: u.id,
            email: u.email,
            nombre: u.nombre,
            apellido: u.apellido,
            nombreCompleto: `${u.nombre} ${u.apellido}`,
            tipo: u.tipo,
            especialidad: u.especialidad,
            telefono: u.telefono,
            biografia: u.biografia,
            activo: u.activo,
            created_at: u.created_at,
            ultimo_acceso: u.ultimo_acceso,
            privilegios: {
                dspace: u.priv_dspace,
                koha_staff: u.priv_koha_staff,
                koha_opac: u.priv_koha_opac,
                admin: u.priv_admin
            }
        }));

        res.json({
            success: true,
            usuarios: usuarios,
            total: usuarios.length
        });
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios'
        });
    }
});

// GET /api/usuarios/:id - Obtener un usuario específico (solo admin)
app.get('/api/usuarios/:id', verificarAutenticacion, verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT id, email, nombre, apellido, tipo, especialidad, telefono, biografia, activo, created_at, ultimo_acceso,
             priv_dspace, priv_koha_staff, priv_koha_opac, priv_admin
             FROM usuarios
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const u = result.rows[0];
        const usuario = {
            id: u.id,
            email: u.email,
            nombre: u.nombre,
            apellido: u.apellido,
            nombreCompleto: `${u.nombre} ${u.apellido}`,
            tipo: u.tipo,
            especialidad: u.especialidad,
            telefono: u.telefono,
            biografia: u.biografia,
            activo: u.activo,
            created_at: u.created_at,
            ultimo_acceso: u.ultimo_acceso,
            privilegios: {
                dspace: u.priv_dspace,
                koha_staff: u.priv_koha_staff,
                koha_opac: u.priv_koha_opac,
                admin: u.priv_admin
            }
        };

        res.json({
            success: true,
            usuario: usuario
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario'
        });
    }
});

// POST /api/usuarios - Crear un nuevo usuario (solo admin)
app.post('/api/usuarios', verificarAutenticacion, verificarAdmin, async (req, res) => {
    try {
        const { email, nombre, apellido, password, tipo, especialidad, telefono, biografia, privilegios } = req.body;

        // Validaciones
        if (!email || !nombre || !apellido || !password || !tipo) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: email, nombre, apellido, password, tipo'
            });
        }

        // Validar contraseña fuerte
        const passwordValidation = validarPasswordFuerte(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message
            });
        }

        // Verificar que el email no exista
        const checkEmail = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (checkEmail.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Hashear contraseña con bcrypt
        const passwordHash = await bcrypt.hash(password, 10);

        // Definir privilegios por defecto según tipo
        let privs = privilegios || {};

        if (tipo === 'administrador') {
            privs = {
                dspace: true,
                koha_staff: true,
                koha_opac: true,
                admin: true,
                ...privilegios
            };
        } else if (tipo === 'estudiante') {
            privs = {
                dspace: true,
                koha_staff: false,
                koha_opac: true,
                admin: false,
                ...privilegios
            };
        } else if (tipo === 'orientador') {
            privs = {
                dspace: false,
                koha_staff: false,
                koha_opac: true,
                admin: false,
                ...privilegios
            };
        }

        // Insertar usuario en base de datos
        const result = await query(
            `INSERT INTO usuarios
             (email, nombre, apellido, password_hash, tipo, especialidad, telefono, biografia,
              priv_dspace, priv_koha_staff, priv_koha_opac, priv_admin)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING id, email, nombre, apellido, tipo, especialidad, created_at`,
            [email, nombre, apellido, passwordHash, tipo, especialidad, telefono, biografia,
             privs.dspace, privs.koha_staff, privs.koha_opac, privs.admin]
        );

        const nuevoUsuario = result.rows[0];

        // ============================================================================
        // SINCRONIZACIÓN AUTOMÁTICA CON SISTEMAS EXTERNOS
        // ============================================================================

        console.log(`\n📤 Sincronizando usuario ${email} con sistemas externos...`);

        const sincronizacionResultados = {
            dspace: { intentado: false, exitoso: false },
            koha: { intentado: false, exitoso: false }
        };

        // Sincronizar con DSpace si tiene privilegios
        if (privs.dspace) {
            console.log(`   → Creando usuario en DSpace...`);
            sincronizacionResultados.dspace.intentado = true;
            const dspaceResult = await crearUsuarioDSpace(email, password, nombre, apellido);
            sincronizacionResultados.dspace.exitoso = dspaceResult.success;
        }

        // Sincronizar con Koha si tiene privilegios (staff o opac)
        if (privs.koha_staff || privs.koha_opac) {
            console.log(`   → Creando usuario en Koha...`);
            sincronizacionResultados.koha.intentado = true;
            const kohaResult = await crearUsuarioKoha(email, password, nombre, apellido, privs.koha_staff, tipo);
            sincronizacionResultados.koha.exitoso = kohaResult.success;
        }

        console.log(`✅ Sincronización completada:`);
        console.log(`   - DSpace: ${sincronizacionResultados.dspace.intentado ? (sincronizacionResultados.dspace.exitoso ? '✅' : '❌') : '⊘ No aplica'}`);
        console.log(`   - Koha: ${sincronizacionResultados.koha.intentado ? (sincronizacionResultados.koha.exitoso ? '✅' : '❌') : '⊘ No aplica'}\n`);

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            usuario: {
                ...nuevoUsuario,
                privilegios: privs
            },
            sincronizacion: sincronizacionResultados
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario'
        });
    }
});

// PUT /api/usuarios/:id - Actualizar un usuario existente (solo admin)
app.put('/api/usuarios/:id', verificarAutenticacion, verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { email, nombre, apellido, password, tipo, especialidad, telefono, biografia, privilegios, activo } = req.body;

        // Verificar que el usuario existe
        const checkUser = await query('SELECT id FROM usuarios WHERE id = $1', [id]);
        if (checkUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Si se proporciona un email nuevo, verificar que no esté en uso
        if (email) {
            const checkEmail = await query('SELECT id FROM usuarios WHERE email = $1 AND id != $2', [email, id]);
            if (checkEmail.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado por otro usuario'
                });
            }
        }

        // Construir query de actualización dinámicamente
        const updates = [];
        const values = [];
        let paramCounter = 1;

        if (email) { updates.push(`email = $${paramCounter++}`); values.push(email); }
        if (nombre) { updates.push(`nombre = $${paramCounter++}`); values.push(nombre); }
        if (apellido) { updates.push(`apellido = $${paramCounter++}`); values.push(apellido); }
        if (tipo) { updates.push(`tipo = $${paramCounter++}`); values.push(tipo); }
        if (especialidad !== undefined) { updates.push(`especialidad = $${paramCounter++}`); values.push(especialidad); }
        if (telefono !== undefined) { updates.push(`telefono = $${paramCounter++}`); values.push(telefono); }
        if (biografia !== undefined) { updates.push(`biografia = $${paramCounter++}`); values.push(biografia); }
        if (activo !== undefined) { updates.push(`activo = $${paramCounter++}`); values.push(activo); }

        if (password) {
            // Validar contraseña fuerte
            const passwordValidation = validarPasswordFuerte(password);
            if (!passwordValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: passwordValidation.message
                });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            updates.push(`password_hash = $${paramCounter++}`);
            values.push(passwordHash);
        }

        if (privilegios) {
            if (privilegios.dspace !== undefined) { updates.push(`priv_dspace = $${paramCounter++}`); values.push(privilegios.dspace); }
            if (privilegios.koha_staff !== undefined) { updates.push(`priv_koha_staff = $${paramCounter++}`); values.push(privilegios.koha_staff); }
            if (privilegios.koha_opac !== undefined) { updates.push(`priv_koha_opac = $${paramCounter++}`); values.push(privilegios.koha_opac); }
            if (privilegios.admin !== undefined) { updates.push(`priv_admin = $${paramCounter++}`); values.push(privilegios.admin); }
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron campos para actualizar'
            });
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const updateQuery = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;
        const result = await query(updateQuery, values);

        const u = result.rows[0];

        // ============================================================================
        // SINCRONIZACIÓN AUTOMÁTICA DE CONTRASEÑA CON SISTEMAS EXTERNOS
        // ============================================================================

        // Si se actualizó la contraseña, sincronizar con sistemas externos
        if (password) {
            console.log(`\n🔄 Sincronizando cambio de contraseña para ${u.email}...`);

            const sincronizacionResultados = {
                dspace: { intentado: false, exitoso: false },
                koha: { intentado: false, exitoso: false }
            };

            // Obtener privilegios del usuario actualizado
            const privs = mapearPrivilegios(u);

            // Sincronizar con DSpace si tiene privilegios
            if (privs.dspace) {
                console.log(`   → Actualizando contraseña en DSpace...`);
                sincronizacionResultados.dspace.intentado = true;
                const dspaceResult = await actualizarPasswordDSpace(u.email, password);
                sincronizacionResultados.dspace.exitoso = dspaceResult.success;
            }

            // Sincronizar con Koha si tiene privilegios (staff o opac)
            if (privs.koha_staff || privs.koha_opac) {
                console.log(`   → Actualizando contraseña en Koha...`);
                sincronizacionResultados.koha.intentado = true;
                const kohaResult = await actualizarPasswordKoha(u.email, password);
                sincronizacionResultados.koha.exitoso = kohaResult.success;
            }

            console.log(`✅ Sincronización de contraseña completada:`);
            console.log(`   - DSpace: ${sincronizacionResultados.dspace.intentado ? (sincronizacionResultados.dspace.exitoso ? '✅' : '❌') : '⊘ No aplica'}`);
            console.log(`   - Koha: ${sincronizacionResultados.koha.intentado ? (sincronizacionResultados.koha.exitoso ? '✅' : '❌') : '⊘ No aplica'}\n`);
        }

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            usuario: {
                id: u.id,
                email: u.email,
                nombre: u.nombre,
                apellido: u.apellido,
                tipo: u.tipo,
                privilegios: mapearPrivilegios(u)
            }
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario'
        });
    }
});

// DELETE /api/usuarios/:id - Eliminar un usuario (solo admin)
app.delete('/api/usuarios/:id', verificarAutenticacion, verificarAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // No permitir eliminar al usuario con ID 1 (admin principal)
        if (parseInt(id) === 1) {
            return res.status(403).json({
                success: false,
                message: 'No se puede eliminar al administrador principal'
            });
        }

        // No permitir que el usuario se elimine a sí mismo
        if (req.session.usuario.id === parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'No puede eliminar su propia cuenta'
            });
        }

        // Eliminar usuario (soft delete)
        const result = await query(
            'UPDATE usuarios SET activo = false WHERE id = $1 RETURNING email',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: `Usuario ${result.rows[0].email} desactivado exitosamente`
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario'
        });
    }
});

// ============================================================================
// ENDPOINTS DE RECUPERACIÓN DE CONTRASEÑA
// ============================================================================

// POST /api/password-reset/request - Solicitar recuperación de contraseña (con rate limiting)
app.post('/api/password-reset/request', passwordResetLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'El email es requerido'
            });
        }

        // Buscar usuario por email
        const result = await query(
            'SELECT id, email, nombre, apellido FROM usuarios WHERE email = $1 AND activo = true',
            [email]
        );

        // Por seguridad, siempre devolvemos éxito aunque el email no exista
        // Esto previene la enumeración de usuarios
        if (result.rows.length === 0) {
            return res.json({
                success: true,
                message: 'Si el email existe, se ha generado un enlace de recuperación',
                // No revelamos que el usuario no existe
                token: null,
                enlace: null
            });
        }

        const usuario = result.rows[0];

        // 1. Invalidar tokens anteriores del mismo usuario (seguridad)
        await query(
            'UPDATE password_reset_tokens SET usado = true WHERE usuario_id = $1 AND usado = false',
            [usuario.id]
        );

        // 2. Verificar cantidad de tokens activos recientes (prevenir abuso)
        const tokensRecientes = await query(
            `SELECT COUNT(*) as count FROM password_reset_tokens
             WHERE usuario_id = $1
             AND creado_en > NOW() - INTERVAL '1 hour'`,
            [usuario.id]
        );

        if (tokensRecientes.rows[0].count >= 5) {
            return res.json({
                success: true,
                message: 'Si el email existe, se ha generado un enlace de recuperación',
                token: null,
                enlace: null
            });
        }

        // Generar token UUID
        const crypto = require('crypto');
        const token = crypto.randomUUID();

        // Calcular expiración (1 hora desde ahora)
        const expiraEn = new Date(Date.now() + 60 * 60 * 1000); // +1 hora

        // Insertar token en base de datos
        await query(
            `INSERT INTO password_reset_tokens (usuario_id, token, expira_en)
             VALUES ($1, $2, $3)`,
            [usuario.id, token, expiraEn]
        );

        // Construir enlace de recuperación
        const baseUrl = process.env.BASE_URL || 'http://localhost:8088';
        const enlaceRecuperacion = `${baseUrl}/reset-password.html?token=${token}`;

        // Log seguro en producción (no exponer tokens)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ Token de recuperación generado para: ${email}`);
            console.log(`   Expira: ${expiraEn.toISOString()}`);
        }

        res.json({
            success: true,
            message: 'Si el email existe, se ha generado un enlace de recuperación',
            token: token,
            enlace: enlaceRecuperacion,
            expira_en: expiraEn.toISOString(),
            // En desarrollo mostramos el token, en producción solo enviaríamos por email
            usuario: {
                nombre: usuario.nombre,
                apellido: usuario.apellido
            }
        });

    } catch (error) {
        console.error('Error en password-reset/request:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar la solicitud'
        });
    }
});

// POST /api/password-reset/validate - Validar token de recuperación
app.post('/api/password-reset/validate', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                valid: false,
                message: 'Token requerido'
            });
        }

        // Buscar token válido (no usado y no expirado)
        const result = await query(
            `SELECT t.id, t.usuario_id, t.expira_en, u.email, u.nombre, u.apellido
             FROM password_reset_tokens t
             JOIN usuarios u ON t.usuario_id = u.id
             WHERE t.token = $1
             AND t.usado = false
             AND t.expira_en > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.json({
                valid: false,
                message: 'Token inválido o expirado'
            });
        }

        const tokenData = result.rows[0];

        res.json({
            valid: true,
            email: tokenData.email,
            nombre: tokenData.nombre,
            apellido: tokenData.apellido,
            expira_en: tokenData.expira_en
        });

    } catch (error) {
        console.error('Error en password-reset/validate:', error);
        res.status(500).json({
            valid: false,
            message: 'Error al validar token'
        });
    }
});

// POST /api/password-reset/reset - Resetear contraseña con token
app.post('/api/password-reset/reset', async (req, res) => {
    try {
        const { token, nueva_password } = req.body;

        if (!token || !nueva_password) {
            return res.status(400).json({
                success: false,
                message: 'Token y nueva contraseña son requeridos'
            });
        }

        // Validar contraseña fuerte
        const passwordValidation = validarPasswordFuerte(nueva_password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message
            });
        }

        // Buscar token válido (no usado y no expirado)
        const tokenResult = await query(
            `SELECT id, usuario_id, expira_en
             FROM password_reset_tokens
             WHERE token = $1
             AND usado = false
             AND expira_en > NOW()`,
            [token]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        const tokenData = tokenResult.rows[0];

        // Hashear nueva contraseña con bcrypt
        const passwordHash = await bcrypt.hash(nueva_password, 10);

        // Actualizar contraseña del usuario
        await query(
            'UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [passwordHash, tokenData.usuario_id]
        );

        // Marcar token como usado
        await query(
            'UPDATE password_reset_tokens SET usado = true, usado_en = NOW() WHERE id = $1',
            [tokenData.id]
        );

        // Obtener email del usuario
        const userResult = await query('SELECT email FROM usuarios WHERE id = $1', [tokenData.usuario_id]);

        // Registrar cambio de contraseña
        await registrarAuditoria({
            usuario_id: tokenData.usuario_id,
            email: userResult.rows[0]?.email,
            accion: 'password_reset',
            entidad: 'usuario',
            entidad_id: tokenData.usuario_id,
            detalles: { method: 'token' },
            ip_address: getClientIP(req),
            user_agent: req.headers['user-agent'],
            resultado: 'success'
        });

        // Log seguro (no exponer IDs en producción)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ Contraseña actualizada para usuario ID: ${tokenData.usuario_id}`);
        }

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error en password-reset/reset:', error);
        res.status(500).json({
            success: false,
            message: 'Error al resetear contraseña'
        });
    }
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
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🔐 Servicio de Autenticación Centralizado (SSO)         ║
║                                                              ║
║     Puerto:    ${PORT}                                          ║
║     Estado:    ✅ ACTIVO                                     ║
║                                                              ║
║     Endpoints de Autenticación:                              ║
║     - POST /api/login       (Autenticación)                  ║
║     - GET  /api/session     (Verificar sesión)               ║
║     - POST /api/logout      (Cerrar sesión)                  ║
║                                                              ║
║     Endpoints de Administración de Usuarios:                 ║
║     - GET    /api/usuarios      (Listar usuarios)            ║
║     - GET    /api/usuarios/:id  (Obtener usuario)            ║
║     - POST   /api/usuarios      (Crear usuario)              ║
║     - PUT    /api/usuarios/:id  (Actualizar usuario)         ║
║     - DELETE /api/usuarios/:id  (Eliminar usuario)           ║
║                                                              ║
║     Endpoints de Orientación Educativa:                      ║
║     - GET    /api/orientadores  (Listar orientadores)        ║
║     - POST   /api/citas         (Solicitar cita)             ║
║     - GET    /api/citas/mis-citas (Mis citas)                ║
║     - PUT    /api/citas/:id/aceptar (Aceptar cita)           ║
║     - POST   /api/citas/:id/proponer-fecha (Proponer fecha)  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);

    // Verificar conexión a PostgreSQL
    console.log('\n🔍 Verificando conexión a PostgreSQL...');
    await verificarConexion();
});

module.exports = app;
