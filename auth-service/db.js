/**
 * ============================================================================
 * CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL
 * Módulo de conexión a la base de datos del sistema
 * ============================================================================
 */

const { Pool } = require('pg');

// Configuración de conexión a PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'dspacedb', // Nombre del contenedor
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'biblioteca_auth',
    user: process.env.DB_USER || 'dspace',
    password: process.env.DB_PASSWORD || 'dspace',
    max: 20, // Máximo de conexiones en el pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Evento de error del pool
pool.on('error', (err, client) => {
    console.error('Error inesperado en el cliente de PostgreSQL:', err);
});

// Función para verificar la conexión
async function verificarConexion() {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Conexión a PostgreSQL exitosa:', res.rows[0].now);
        return true;
    } catch (err) {
        console.error('❌ Error al conectar con PostgreSQL:', err);
        return false;
    }
}

// Helper: ejecutar consulta
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Query ejecutado:', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Error en query:', error);
        throw error;
    }
}

// Helper: obtener un cliente del pool
async function getClient() {
    return await pool.connect();
}

module.exports = {
    pool,
    query,
    getClient,
    verificarConexion
};
