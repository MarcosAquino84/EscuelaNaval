// Usuarios de ejemplo con grados militares para el panel (biblioteca_auth).
// Se ejecuta DENTRO del contenedor auth-service:
//   docker cp datos-ejemplo/usuarios-ejemplo.js auth-service:/tmp/
//   docker exec auth-service node /tmp/usuarios-ejemplo.js
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// [email, nombre, apellido, password, tipo, especialidad]
const usuarios = [
    ['cadete.perez@henm.edu.mx',    'Luis',     'Pérez',   'Cadete123',   'estudiante',    null],
    ['cadete.gomez@henm.edu.mx',    'Ana',      'Gómez',   'Cadete123',   'estudiante',    null],
    ['cadete.torres@henm.edu.mx',   'María',    'Torres',  'Cadete123',   'estudiante',    null],
    ['soldado.ramos@henm.edu.mx',   'Pedro',    'Ramos',   'Soldado123',  'estudiante',    null],
    ['soldado.diaz@henm.edu.mx',    'Lucía',    'Díaz',    'Soldado123',  'estudiante',    null],
    ['cabo.mendoza@henm.edu.mx',    'Jorge',    'Mendoza', 'Cabo1234',    'estudiante',    null],
    ['cabo.silva@henm.edu.mx',      'Carmen',   'Silva',   'Cabo1234',    'estudiante',    null],
    ['teniente.vargas@henm.edu.mx', 'Roberto',  'Vargas',  'Teniente123', 'orientador',    'Consejería y Desarrollo Militar'],
    ['coronel.herrera@henm.edu.mx', 'Fernando', 'Herrera', 'Coronel123',  'administrador', null],
];

(async () => {
    for (const [email, nombre, apellido, password, tipo, especialidad] of usuarios) {
        const hash = await bcrypt.hash(password, 10);
        const esAdmin = tipo === 'administrador';
        const res = await pool.query(
            `INSERT INTO usuarios
                (email, nombre, apellido, password_hash, tipo, especialidad,
                 priv_dspace, priv_koha_staff, priv_koha_opac, priv_admin)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
             RETURNING id`,
            [email, nombre, apellido, hash, tipo, especialidad,
             true, esAdmin, true, esAdmin]
        );
        console.log(`${email} -> id ${res.rows[0].id} (${tipo})`);

        // Disponibilidad Lun-Vie para orientadores nuevos
        if (tipo === 'orientador') {
            for (let dia = 1; dia <= 5; dia++) {
                await pool.query(
                    `INSERT INTO disponibilidad_orientadores (orientador_id, dia_semana, hora_inicio, hora_fin)
                     VALUES ($1,$2,'09:00','12:00'), ($1,$2,'14:00','17:00')
                     ON CONFLICT DO NOTHING`,
                    [res.rows[0].id, dia]
                );
            }
            console.log(`  disponibilidad Lun-Vie creada`);
        }
    }
    await pool.end();
    console.log('Usuarios de ejemplo listos.');
})().catch(e => { console.error(e); process.exit(1); });
