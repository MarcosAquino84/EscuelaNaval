const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const { body, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'biblioteca-auth' },
  transports: [
    new winston.transports.File({ filename: '/app/logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: '/app/logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Conexiones a bases de datos
const authPool = new Pool({
  host: process.env.AUTH_DB_HOST || 'auth-db-integrated',
  port: process.env.AUTH_DB_PORT || 5432,
  database: process.env.AUTH_DB_NAME || 'biblioteca_auth',
  user: process.env.AUTH_DB_USER || 'auth_user',
  password: process.env.AUTH_DB_PASSWORD || 'auth_secure_pass',
});

const kohaPool = mysql.createPool({
  host: process.env.KOHA_DB_HOST || 'koha-db-integrated',
  port: process.env.KOHA_DB_PORT || 3306,
  database: process.env.KOHA_DB_NAME || 'koha_biblioteca',
  user: process.env.KOHA_DB_USER || 'koha_user',
  password: process.env.KOHA_DB_PASSWORD || 'koha_pass',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const dspacePool = new Pool({
  host: process.env.DSPACE_DB_HOST || 'dspace-db-integrated',
  port: process.env.DSPACE_DB_PORT || 5432,
  database: process.env.DSPACE_DB_NAME || 'dspace',
  user: process.env.DSPACE_DB_USER || 'dspace',
  password: process.env.DSPACE_DB_PASSWORD || 'dspace',
});

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8101',
    'http://localhost:8102',
    'http://localhost:4001',
    'http://localhost:8091'
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP
  message: 'Demasiadas solicitudes, intenta más tarde'
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware de autenticación JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'biblioteca_jwt_secret_key_2025');
    req.user = decoded;
    
    // Verificar si la sesión existe en la base de datos
    const sessionCheck = await authPool.query(
      'SELECT id, expires_at FROM user_sessions WHERE jwt_token = $1 AND expires_at > NOW()',
      [token]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(401).json({ error: 'Sesión expirada o inválida' });
    }

    // Actualizar última actividad
    await authPool.query(
      'UPDATE user_sessions SET last_activity = NOW() WHERE jwt_token = $1',
      [token]
    );

    next();
  } catch (error) {
    logger.error('Error verificando token:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'biblioteca-auth-service'
  });
});

// Registro de nuevo usuario
app.post('/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').optional().trim().escape(),
  body('lastName').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName, role = 'user' } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await authPool.query(
      'SELECT id FROM unified_users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Usuario o email ya existe' });
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar usuario
    const result = await authPool.query(
      `INSERT INTO unified_users (username, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, first_name, last_name, role, created_at`,
      [username, email, passwordHash, firstName, lastName, role]
    );

    const newUser = result.rows[0];

    // Log del registro
    await authPool.query(
      'INSERT INTO auth_logs (user_id, username, action, system, ip_address, success) VALUES ($1, $2, $3, $4, $5, $6)',
      [newUser.id, username, 'register', 'auth-service', req.ip, true]
    );

    logger.info(`Usuario registrado: ${username}`, { userId: newUser.id, email });

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    logger.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Login
app.post('/login', [
  body('username').trim().escape(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Buscar usuario
    const userResult = await authPool.query(
      'SELECT id, username, email, password_hash, first_name, last_name, role, status FROM unified_users WHERE username = $1 OR email = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      await authPool.query(
        'INSERT INTO auth_logs (username, action, system, ip_address, success, error_message) VALUES ($1, $2, $3, $4, $5, $6)',
        [username, 'failed_login', 'auth-service', req.ip, false, 'Usuario no encontrado']
      );
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];

    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Cuenta desactivada' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      await authPool.query(
        'INSERT INTO auth_logs (user_id, username, action, system, ip_address, success, error_message) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [user.id, username, 'failed_login', 'auth-service', req.ip, false, 'Contraseña incorrecta']
      );
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'biblioteca_jwt_secret_key_2025',
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    // Crear sesión
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    const sessionToken = require('crypto').randomBytes(32).toString('hex');

    await authPool.query(
      `INSERT INTO user_sessions (user_id, session_token, jwt_token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, sessionToken, token, expiresAt, req.ip, req.get('User-Agent')]
    );

    // Actualizar último login
    await authPool.query(
      'UPDATE unified_users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Log exitoso
    await authPool.query(
      'INSERT INTO auth_logs (user_id, username, action, system, ip_address, success) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.id, username, 'login', 'auth-service', req.ip, true]
    );

    logger.info(`Login exitoso: ${username}`, { userId: user.id });

    // Configurar cookie segura
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    logger.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Logout
app.post('/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1] || req.cookies.auth_token;

    // Eliminar sesión
    await authPool.query(
      'DELETE FROM user_sessions WHERE jwt_token = $1',
      [token]
    );

    // Log de logout
    await authPool.query(
      'INSERT INTO auth_logs (user_id, username, action, system, ip_address, success) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.userId, req.user.username, 'logout', 'auth-service', req.ip, true]
    );

    res.clearCookie('auth_token');
    res.json({ message: 'Logout exitoso' });

  } catch (error) {
    logger.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar token
app.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Obtener permisos del usuario
    const permissions = await authPool.query(
      'SELECT system, permission FROM user_permissions WHERE user_id = $1',
      [req.user.userId]
    );

    res.json({
      valid: true,
      user: req.user,
      permissions: permissions.rows
    });
  } catch (error) {
    logger.error('Error verificando token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Información del usuario
app.get('/user/profile', authenticateToken, async (req, res) => {
  try {
    const userResult = await authPool.query(
      `SELECT id, username, email, first_name, last_name, role, status, 
              preferred_language, timezone, created_at, last_login
       FROM unified_users WHERE id = $1`,
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];

    // Obtener permisos
    const permissions = await authPool.query(
      'SELECT system, permission FROM user_permissions WHERE user_id = $1',
      [req.user.userId]
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        preferredLanguage: user.preferred_language,
        timezone: user.timezone,
        createdAt: user.created_at,
        lastLogin: user.last_login
      },
      permissions: permissions.rows
    });

  } catch (error) {
    logger.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Sincronizar usuario con Koha (solo para usuarios autorizados)
app.post('/sync/koha/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }

    const userId = parseInt(req.params.userId);
    
    // Obtener datos del usuario
    const userResult = await authPool.query(
      'SELECT * FROM unified_users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];

    // Sincronizar con Koha (implementar según estructura de Koha)
    // Esto dependerá de la estructura específica de la base de datos de Koha
    
    logger.info(`Sincronización con Koha iniciada para usuario ${user.username}`);
    
    res.json({ message: 'Sincronización con Koha en progreso' });

  } catch (error) {
    logger.error('Error sincronizando con Koha:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Manejo de errores global
app.use((error, req, res, next) => {
  logger.error('Error no manejado:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`Servicio de autenticación iniciado en puerto ${PORT}`);
  console.log(`🚀 Servicio de autenticación ejecutándose en http://localhost:${PORT}`);
  
  // Limpiar sesiones expiradas cada hora
  setInterval(async () => {
    try {
      const result = await authPool.query('SELECT cleanup_expired_sessions()');
      const deletedCount = result.rows[0].cleanup_expired_sessions;
      if (deletedCount > 0) {
        logger.info(`Limpiadas ${deletedCount} sesiones expiradas`);
      }
    } catch (error) {
      logger.error('Error limpiando sesiones expiradas:', error);
    }
  }, 60 * 60 * 1000); // cada hora
});

// Manejo graceful de cierre
process.on('SIGTERM', () => {
  logger.info('Cerrando servicio de autenticación...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Cerrando servicio de autenticación...');
  process.exit(0);
});