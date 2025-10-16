/**
 * ============================================================================
 * ENDPOINTS API - MÓDULO DE ORIENTACIÓN EDUCATIVA
 * Gestión de citas entre estudiantes y orientadores
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { query, getClient } = require('./db');

// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================================================

function verificarAutenticacion(req, res, next) {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({
            success: false,
            message: 'No autenticado. Debe iniciar sesión.'
        });
    }
    next();
}

function verificarRol(...rolesPermitidos) {
    return (req, res, next) => {
        if (!req.session.usuario) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }

        if (!rolesPermitidos.includes(req.session.usuario.tipo)) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para realizar esta acción'
            });
        }

        next();
    };
}

// ============================================================================
// ENDPOINTS - GESTIÓN DE ORIENTADORES
// ============================================================================

// GET /api/orientadores - Listar orientadores disponibles
router.get('/orientadores', verificarAutenticacion, async (req, res) => {
    try {
        const result = await query(
            `SELECT
                id, email, nombre, apellido, especialidad, telefono, biografia
             FROM usuarios
             WHERE tipo = 'orientador' AND activo = true
             ORDER BY nombre, apellido`
        );

        res.json({
            success: true,
            orientadores: result.rows
        });
    } catch (error) {
        console.error('Error al obtener orientadores:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la lista de orientadores'
        });
    }
});

// GET /api/orientadores/:id - Obtener información de un orientador
router.get('/orientadores/:id', verificarAutenticacion, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT
                id, email, nombre, apellido, especialidad, telefono, biografia
             FROM usuarios
             WHERE id = $1 AND tipo = 'orientador' AND activo = true`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Orientador no encontrado'
            });
        }

        res.json({
            success: true,
            orientador: result.rows[0]
        });
    } catch (error) {
        console.error('Error al obtener orientador:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información del orientador'
        });
    }
});

// GET /api/orientadores/:id/disponibilidad - Obtener disponibilidad de un orientador
router.get('/orientadores/:id/disponibilidad', verificarAutenticacion, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT id, dia_semana, hora_inicio, hora_fin, activo
             FROM disponibilidad_orientadores
             WHERE orientador_id = $1 AND activo = true
             ORDER BY dia_semana, hora_inicio`,
            [id]
        );

        res.json({
            success: true,
            disponibilidad: result.rows
        });
    } catch (error) {
        console.error('Error al obtener disponibilidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener disponibilidad del orientador'
        });
    }
});

// PUT /api/orientadores/disponibilidad - Configurar disponibilidad (solo orientadores)
router.put('/orientadores/disponibilidad',
    verificarAutenticacion,
    verificarRol('orientador', 'administrador'),
    async (req, res) => {
        const client = await getClient();

        try {
            const { disponibilidad } = req.body;
            const orientadorId = req.session.usuario.id;

            await client.query('BEGIN');

            // Eliminar disponibilidad anterior
            await client.query(
                'DELETE FROM disponibilidad_orientadores WHERE orientador_id = $1',
                [orientadorId]
            );

            // Insertar nueva disponibilidad
            for (const slot of disponibilidad) {
                await client.query(
                    `INSERT INTO disponibilidad_orientadores
                     (orientador_id, dia_semana, hora_inicio, hora_fin, activo)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [orientadorId, slot.dia_semana, slot.hora_inicio, slot.hora_fin, true]
                );
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Disponibilidad actualizada correctamente'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error al actualizar disponibilidad:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar disponibilidad'
            });
        } finally {
            client.release();
        }
    }
);

// ============================================================================
// ENDPOINTS - GESTIÓN DE CITAS
// ============================================================================

// POST /api/citas - Solicitar una nueva cita (estudiante)
router.post('/citas',
    verificarAutenticacion,
    verificarRol('estudiante', 'administrador'),
    async (req, res) => {
        try {
            const {
                orientador_id,
                fecha_hora,
                duracion_minutos = 60,
                modalidad = 'presencial',
                ubicacion,
                motivo,
                descripcion_estudiante
            } = req.body;

            const estudiante_id = req.session.usuario.id;

            // Validaciones
            if (!orientador_id || !fecha_hora || !motivo) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan datos requeridos: orientador, fecha_hora, motivo'
                });
            }

            // Verificar que la fecha no sea en el pasado
            const fechaCita = new Date(fecha_hora);
            if (fechaCita <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha de la cita no puede ser en el pasado'
                });
            }

            // Verificar que el orientador existe y está activo
            const orientadorCheck = await query(
                'SELECT id FROM usuarios WHERE id = $1 AND tipo = $2 AND activo = true',
                [orientador_id, 'orientador']
            );

            if (orientadorCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Orientador no encontrado o inactivo'
                });
            }

            // Verificar que no haya conflicto de horario
            const conflictoCheck = await query(
                `SELECT id FROM citas
                 WHERE orientador_id = $1
                   AND fecha_hora = $2
                   AND estado NOT IN ('rechazada', 'cancelada_estudiante', 'cancelada_orientador', 'completada')`,
                [orientador_id, fecha_hora]
            );

            if (conflictoCheck.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'El orientador ya tiene una cita en ese horario'
                });
            }

            // Insertar la cita
            const result = await query(
                `INSERT INTO citas
                 (estudiante_id, orientador_id, fecha_hora, duracion_minutos, modalidad, ubicacion, motivo, descripcion_estudiante, estado)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendiente')
                 RETURNING id, uuid, fecha_hora, estado, created_at`,
                [estudiante_id, orientador_id, fecha_hora, duracion_minutos, modalidad, ubicacion, motivo, descripcion_estudiante]
            );

            res.status(201).json({
                success: true,
                message: 'Solicitud de cita enviada correctamente',
                cita: result.rows[0]
            });
        } catch (error) {
            console.error('Error al crear cita:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear la solicitud de cita'
            });
        }
    }
);

// GET /api/citas/mis-citas - Obtener citas del usuario actual
router.get('/citas/mis-citas', verificarAutenticacion, async (req, res) => {
    try {
        const usuarioId = req.session.usuario.id;
        const usuarioTipo = req.session.usuario.tipo;

        let queryText;
        let queryParams;

        if (usuarioTipo === 'estudiante') {
            // Citas donde soy estudiante
            queryText = `
                SELECT
                    c.id, c.uuid, c.fecha_hora, c.duracion_minutos, c.modalidad, c.ubicacion,
                    c.motivo, c.descripcion_estudiante, c.estado, c.notas_orientador, c.motivo_rechazo,
                    c.created_at, c.updated_at,
                    o.id as orientador_id, o.nombre as orientador_nombre, o.apellido as orientador_apellido,
                    o.especialidad as orientador_especialidad
                FROM citas c
                INNER JOIN usuarios o ON c.orientador_id = o.id
                WHERE c.estudiante_id = $1
                ORDER BY c.fecha_hora DESC
            `;
            queryParams = [usuarioId];
        } else if (usuarioTipo === 'orientador') {
            // Citas donde soy orientador
            queryText = `
                SELECT
                    c.id, c.uuid, c.fecha_hora, c.duracion_minutos, c.modalidad, c.ubicacion,
                    c.motivo, c.descripcion_estudiante, c.estado, c.notas_orientador, c.notas_privadas,
                    c.motivo_rechazo, c.created_at, c.updated_at,
                    e.id as estudiante_id, e.nombre as estudiante_nombre, e.apellido as estudiante_apellido,
                    e.email as estudiante_email
                FROM citas c
                INNER JOIN usuarios e ON c.estudiante_id = e.id
                WHERE c.orientador_id = $1
                ORDER BY c.fecha_hora DESC
            `;
            queryParams = [usuarioId];
        } else {
            // Administrador: todas las citas
            queryText = `
                SELECT
                    c.id, c.uuid, c.fecha_hora, c.duracion_minutos, c.modalidad, c.ubicacion,
                    c.motivo, c.descripcion_estudiante, c.estado, c.notas_orientador,
                    c.created_at, c.updated_at,
                    e.id as estudiante_id, e.nombre as estudiante_nombre, e.apellido as estudiante_apellido,
                    o.id as orientador_id, o.nombre as orientador_nombre, o.apellido as orientador_apellido,
                    o.especialidad as orientador_especialidad
                FROM citas c
                INNER JOIN usuarios e ON c.estudiante_id = e.id
                INNER JOIN usuarios o ON c.orientador_id = o.id
                ORDER BY c.fecha_hora DESC
            `;
            queryParams = [];
        }

        const result = await query(queryText, queryParams);

        res.json({
            success: true,
            citas: result.rows
        });
    } catch (error) {
        console.error('Error al obtener mis citas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las citas'
        });
    }
});

// GET /api/citas/pendientes - Obtener citas pendientes (orientador)
router.get('/citas/pendientes',
    verificarAutenticacion,
    verificarRol('orientador', 'administrador'),
    async (req, res) => {
        try {
            const orientadorId = req.session.usuario.id;

            const result = await query(
                `SELECT
                    c.id, c.uuid, c.fecha_hora, c.duracion_minutos, c.modalidad, c.ubicacion,
                    c.motivo, c.descripcion_estudiante, c.estado, c.created_at,
                    e.id as estudiante_id, e.nombre as estudiante_nombre, e.apellido as estudiante_apellido,
                    e.email as estudiante_email
                 FROM citas c
                 INNER JOIN usuarios e ON c.estudiante_id = e.id
                 WHERE c.orientador_id = $1 AND c.estado = 'pendiente'
                 ORDER BY c.fecha_hora ASC`,
                [orientadorId]
            );

            res.json({
                success: true,
                citas: result.rows
            });
        } catch (error) {
            console.error('Error al obtener citas pendientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener citas pendientes'
            });
        }
    }
);

// PUT /api/citas/:id/aceptar - Aceptar una cita (orientador)
router.put('/citas/:id/aceptar',
    verificarAutenticacion,
    verificarRol('orientador', 'administrador'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { ubicacion, notas_orientador } = req.body;
            const orientadorId = req.session.usuario.id;

            // Verificar que la cita existe y pertenece al orientador
            const citaCheck = await query(
                'SELECT * FROM citas WHERE id = $1 AND orientador_id = $2',
                [id, orientadorId]
            );

            if (citaCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada'
                });
            }

            if (citaCheck.rows[0].estado !== 'pendiente') {
                return res.status(400).json({
                    success: false,
                    message: 'Solo se pueden aceptar citas pendientes'
                });
            }

            // Actualizar la cita
            const result = await query(
                `UPDATE citas
                 SET estado = 'aceptada', ubicacion = $1, notas_orientador = $2, updated_at = NOW()
                 WHERE id = $3
                 RETURNING *`,
                [ubicacion, notas_orientador, id]
            );

            res.json({
                success: true,
                message: 'Cita aceptada correctamente',
                cita: result.rows[0]
            });
        } catch (error) {
            console.error('Error al aceptar cita:', error);
            res.status(500).json({
                success: false,
                message: 'Error al aceptar la cita'
            });
        }
    }
);

// PUT /api/citas/:id/rechazar - Rechazar una cita (orientador)
router.put('/citas/:id/rechazar',
    verificarAutenticacion,
    verificarRol('orientador', 'administrador'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { motivo_rechazo } = req.body;
            const orientadorId = req.session.usuario.id;

            if (!motivo_rechazo) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar un motivo de rechazo'
                });
            }

            const result = await query(
                `UPDATE citas
                 SET estado = 'rechazada', motivo_rechazo = $1, updated_at = NOW()
                 WHERE id = $2 AND orientador_id = $3 AND estado = 'pendiente'
                 RETURNING *`,
                [motivo_rechazo, id, orientadorId]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada o ya fue procesada'
                });
            }

            res.json({
                success: true,
                message: 'Cita rechazada correctamente',
                cita: result.rows[0]
            });
        } catch (error) {
            console.error('Error al rechazar cita:', error);
            res.status(500).json({
                success: false,
                message: 'Error al rechazar la cita'
            });
        }
    }
);

// POST /api/citas/:id/proponer-fecha - Proponer nueva fecha (orientador)
router.post('/citas/:id/proponer-fecha',
    verificarAutenticacion,
    verificarRol('orientador', 'administrador'),
    async (req, res) => {
        const client = await getClient();

        try {
            const { id } = req.params;
            const { fecha_hora_propuesta, mensaje } = req.body;
            const orientadorId = req.session.usuario.id;

            if (!fecha_hora_propuesta) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar una fecha y hora propuesta'
                });
            }

            await client.query('BEGIN');

            // Obtener cita original
            const citaResult = await client.query(
                'SELECT * FROM citas WHERE id = $1 AND orientador_id = $2',
                [id, orientadorId]
            );

            if (citaResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada'
                });
            }

            const cita = citaResult.rows[0];

            // Crear propuesta
            await client.query(
                `INSERT INTO propuestas_fecha
                 (cita_id, fecha_hora_original, fecha_hora_propuesta, propuesta_por, mensaje, estado)
                 VALUES ($1, $2, $3, $4, $5, 'pendiente')`,
                [id, cita.fecha_hora, fecha_hora_propuesta, orientadorId, mensaje]
            );

            // Actualizar estado de la cita
            await client.query(
                `UPDATE citas
                 SET estado = 'propuesta_alternativa', updated_at = NOW()
                 WHERE id = $1`,
                [id]
            );

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Propuesta de nueva fecha enviada correctamente'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error al proponer nueva fecha:', error);
            res.status(500).json({
                success: false,
                message: 'Error al proponer nueva fecha'
            });
        } finally {
            client.release();
        }
    }
);

// PUT /api/citas/:id/responder-propuesta - Responder a propuesta (estudiante)
router.put('/citas/:id/responder-propuesta',
    verificarAutenticacion,
    verificarRol('estudiante', 'administrador'),
    async (req, res) => {
        const client = await getClient();

        try {
            const { id } = req.params;
            const { aceptar, mensaje_respuesta } = req.body;
            const estudianteId = req.session.usuario.id;

            await client.query('BEGIN');

            // Obtener propuesta pendiente
            const propuestaResult = await client.query(
                `SELECT p.*, c.estudiante_id
                 FROM propuestas_fecha p
                 INNER JOIN citas c ON p.cita_id = c.id
                 WHERE c.id = $1 AND c.estudiante_id = $2 AND p.estado = 'pendiente'
                 ORDER BY p.created_at DESC
                 LIMIT 1`,
                [id, estudianteId]
            );

            if (propuestaResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'No hay propuestas pendientes para esta cita'
                });
            }

            const propuesta = propuestaResult.rows[0];

            if (aceptar) {
                // Aceptar propuesta: actualizar fecha de la cita
                await client.query(
                    `UPDATE citas
                     SET fecha_hora = $1, estado = 'aceptada', updated_at = NOW()
                     WHERE id = $2`,
                    [propuesta.fecha_hora_propuesta, id]
                );

                await client.query(
                    `UPDATE propuestas_fecha
                     SET estado = 'aceptada', respondida_por = $1, fecha_respuesta = NOW(), mensaje_respuesta = $2
                     WHERE id = $3`,
                    [estudianteId, mensaje_respuesta, propuesta.id]
                );

                await client.query('COMMIT');

                res.json({
                    success: true,
                    message: 'Propuesta aceptada. La cita ha sido confirmada con la nueva fecha.'
                });
            } else {
                // Rechazar propuesta
                await client.query(
                    `UPDATE propuestas_fecha
                     SET estado = 'rechazada', respondida_por = $1, fecha_respuesta = NOW(), mensaje_respuesta = $2
                     WHERE id = $3`,
                    [estudianteId, mensaje_respuesta, propuesta.id]
                );

                await client.query(
                    `UPDATE citas
                     SET estado = 'rechazada', updated_at = NOW()
                     WHERE id = $1`,
                    [id]
                );

                await client.query('COMMIT');

                res.json({
                    success: true,
                    message: 'Propuesta rechazada. La cita ha sido cancelada.'
                });
            }
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error al responder propuesta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al responder la propuesta'
            });
        } finally {
            client.release();
        }
    }
);

// DELETE /api/citas/:id - Cancelar cita
router.delete('/citas/:id', verificarAutenticacion, async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo_cancelacion } = req.body;
        const usuarioId = req.session.usuario.id;
        const usuarioTipo = req.session.usuario.tipo;

        // Obtener cita
        const citaResult = await query(
            'SELECT * FROM citas WHERE id = $1',
            [id]
        );

        if (citaResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cita no encontrada'
            });
        }

        const cita = citaResult.rows[0];
        let nuevoEstado;

        if (cita.estudiante_id === usuarioId || usuarioTipo === 'administrador') {
            nuevoEstado = 'cancelada_estudiante';
        } else if (cita.orientador_id === usuarioId) {
            nuevoEstado = 'cancelada_orientador';
        } else {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para cancelar esta cita'
            });
        }

        // Solo se pueden cancelar citas pendientes o aceptadas
        if (!['pendiente', 'aceptada'].includes(cita.estado)) {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden cancelar citas pendientes o aceptadas'
            });
        }

        const result = await query(
            `UPDATE citas
             SET estado = $1, motivo_cancelacion = $2, updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [nuevoEstado, motivo_cancelacion, id]
        );

        res.json({
            success: true,
            message: 'Cita cancelada correctamente',
            cita: result.rows[0]
        });
    } catch (error) {
        console.error('Error al cancelar cita:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar la cita'
        });
    }
});

// PUT /api/citas/:id/completar - Marcar cita como completada (orientador)
router.put('/citas/:id/completar',
    verificarAutenticacion,
    verificarRol('orientador', 'administrador'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { notas_orientador, notas_privadas } = req.body;
            const orientadorId = req.session.usuario.id;

            const result = await query(
                `UPDATE citas
                 SET estado = 'completada',
                     notas_orientador = $1,
                     notas_privadas = $2,
                     fecha_completada = NOW(),
                     updated_at = NOW()
                 WHERE id = $3 AND orientador_id = $4 AND estado = 'aceptada'
                 RETURNING *`,
                [notas_orientador, notas_privadas, id, orientadorId]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada o no está en estado aceptada'
                });
            }

            res.json({
                success: true,
                message: 'Cita marcada como completada',
                cita: result.rows[0]
            });
        } catch (error) {
            console.error('Error al completar cita:', error);
            res.status(500).json({
                success: false,
                message: 'Error al marcar la cita como completada'
            });
        }
    }
);

// PUT /api/citas/:id/notas - Actualizar notas de una cita (orientador)
router.put('/citas/:id/notas',
    verificarAutenticacion,
    verificarRol('orientador', 'administrador'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { notas_orientador } = req.body;
            const orientadorId = req.session.usuario.id;

            const result = await query(
                `UPDATE citas
                 SET notas_orientador = $1, updated_at = NOW()
                 WHERE id = $2 AND orientador_id = $3
                 RETURNING *`,
                [notas_orientador, id, orientadorId]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Notas actualizadas correctamente',
                cita: result.rows[0]
            });
        } catch (error) {
            console.error('Error al actualizar notas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar las notas'
            });
        }
    }
);

// GET /api/citas/todas - Obtener todas las citas (administrador)
router.get('/citas/todas',
    verificarAutenticacion,
    verificarRol('administrador'),
    async (req, res) => {
        try {
            const result = await query(
                `SELECT
                    c.id, c.uuid, c.fecha_hora, c.duracion_minutos, c.modalidad, c.ubicacion,
                    c.motivo, c.descripcion_estudiante, c.estado, c.notas_orientador,
                    c.motivo_rechazo, c.motivo_cancelacion, c.created_at, c.updated_at,
                    e.id as estudiante_id, e.nombre as estudiante_nombre, e.apellido as estudiante_apellido,
                    e.email as estudiante_email,
                    o.id as orientador_id, o.nombre as orientador_nombre, o.apellido as orientador_apellido,
                    o.email as orientador_email, o.especialidad
                FROM citas c
                INNER JOIN usuarios e ON c.estudiante_id = e.id
                INNER JOIN usuarios o ON c.orientador_id = o.id
                ORDER BY c.fecha_hora DESC`
            );

            res.json({
                success: true,
                citas: result.rows
            });
        } catch (error) {
            console.error('Error al obtener todas las citas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las citas'
            });
        }
    }
);

// ============================================================================
// ENDPOINTS - ESTADÍSTICAS Y REPORTES
// ============================================================================

// GET /api/citas/estadisticas - Obtener estadísticas (administrador)
router.get('/citas/estadisticas',
    verificarAutenticacion,
    verificarRol('administrador'),
    async (req, res) => {
        try {
            const estadisticas = await query(
                `SELECT
                    COUNT(*) as total_citas,
                    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
                    COUNT(CASE WHEN estado = 'aceptada' THEN 1 END) as aceptadas,
                    COUNT(CASE WHEN estado = 'completada' THEN 1 END) as completadas,
                    COUNT(CASE WHEN estado = 'rechazada' THEN 1 END) as rechazadas,
                    COUNT(CASE WHEN estado LIKE 'cancelada_%' THEN 1 END) as canceladas
                 FROM citas`
            );

            const citasPorOrientador = await query(
                `SELECT
                    u.id, u.nombre, u.apellido, u.especialidad,
                    COUNT(c.id) as total_citas,
                    COUNT(CASE WHEN c.estado = 'completada' THEN 1 END) as completadas
                 FROM usuarios u
                 LEFT JOIN citas c ON u.id = c.orientador_id
                 WHERE u.tipo = 'orientador'
                 GROUP BY u.id, u.nombre, u.apellido, u.especialidad
                 ORDER BY total_citas DESC`
            );

            res.json({
                success: true,
                estadisticas: estadisticas.rows[0],
                por_orientador: citasPorOrientador.rows
            });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas'
            });
        }
    }
);

module.exports = router;
