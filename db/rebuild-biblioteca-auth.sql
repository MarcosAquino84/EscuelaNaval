-- ============================================================================
-- RECONSTRUCCIÓN COMPLETA DE biblioteca_auth (PostgreSQL)
-- Reconstrucción post-migración a Docker Desktop (julio 2026).
-- Ejecutar DENTRO de la base biblioteca_auth:
--   docker exec -i dspacedb psql -U dspace -d biblioteca_auth < db/rebuild-biblioteca-auth.sql
-- Consolida: db/schema-orientacion.sql + password_reset_tokens (doc DISEÑO_
-- RECUPERACION_CONTRASEÑAS.md) + auth-service/migrations/002_create_audit_log.sql
-- NOTA: los usuarios semilla se insertan con hashes placeholder; las
-- contraseñas reales se fijan después con UPDATE (ver generate-hash.js).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLA: usuarios
-- ============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('administrador', 'estudiante', 'orientador')),

    priv_dspace BOOLEAN DEFAULT false,
    priv_koha_staff BOOLEAN DEFAULT false,
    priv_koha_opac BOOLEAN DEFAULT false,
    priv_admin BOOLEAN DEFAULT false,

    especialidad VARCHAR(100),
    telefono VARCHAR(20),
    biografia TEXT,

    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    ultimo_acceso TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- ============================================================================
-- TABLA: citas
-- ============================================================================

CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,

    estudiante_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    orientador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    fecha_hora TIMESTAMP NOT NULL,
    duracion_minutos INTEGER DEFAULT 60 CHECK (duracion_minutos > 0),
    modalidad VARCHAR(50) DEFAULT 'presencial' CHECK (modalidad IN ('presencial', 'virtual', 'telefonica')),
    ubicacion VARCHAR(255),

    motivo TEXT NOT NULL,
    descripcion_estudiante TEXT,

    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',
        'aceptada',
        'rechazada',
        'propuesta_alternativa',
        'cancelada_estudiante',
        'cancelada_orientador',
        'completada',
        'no_asistio'
    )),

    notas_orientador TEXT,
    notas_privadas TEXT,
    motivo_rechazo TEXT,
    motivo_cancelacion TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    fecha_completada TIMESTAMP,

    CONSTRAINT chk_fecha_futura CHECK (fecha_hora > created_at),
    CONSTRAINT chk_diferentes_usuarios CHECK (estudiante_id != orientador_id)
);

CREATE INDEX IF NOT EXISTS idx_citas_estudiante ON citas(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_citas_orientador ON citas(orientador_id);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);
CREATE INDEX IF NOT EXISTS idx_citas_fecha_hora ON citas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_citas_orientador_fecha ON citas(orientador_id, fecha_hora);

-- ============================================================================
-- TABLA: propuestas_fecha
-- ============================================================================

CREATE TABLE IF NOT EXISTS propuestas_fecha (
    id SERIAL PRIMARY KEY,
    cita_id INTEGER NOT NULL REFERENCES citas(id) ON DELETE CASCADE,

    fecha_hora_original TIMESTAMP NOT NULL,
    fecha_hora_propuesta TIMESTAMP NOT NULL,
    propuesta_por INTEGER NOT NULL REFERENCES usuarios(id),
    mensaje TEXT,

    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',
        'aceptada',
        'rechazada'
    )),

    respondida_por INTEGER REFERENCES usuarios(id),
    fecha_respuesta TIMESTAMP,
    mensaje_respuesta TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_propuestas_cita ON propuestas_fecha(cita_id);
CREATE INDEX IF NOT EXISTS idx_propuestas_estado ON propuestas_fecha(estado);

-- ============================================================================
-- TABLA: disponibilidad_orientadores
-- ============================================================================

CREATE TABLE IF NOT EXISTS disponibilidad_orientadores (
    id SERIAL PRIMARY KEY,
    orientador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),

    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,

    activo BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_horario_valido CHECK (hora_fin > hora_inicio),
    CONSTRAINT unique_orientador_dia_horario UNIQUE (orientador_id, dia_semana, hora_inicio, hora_fin)
);

CREATE INDEX IF NOT EXISTS idx_disponibilidad_orientador ON disponibilidad_orientadores(orientador_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidad_dia ON disponibilidad_orientadores(dia_semana);
CREATE INDEX IF NOT EXISTS idx_disponibilidad_activo ON disponibilidad_orientadores(activo);

-- ============================================================================
-- TABLA: notificaciones
-- ============================================================================

CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cita_id INTEGER REFERENCES citas(id) ON DELETE CASCADE,

    tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
        'cita_solicitada',
        'cita_aceptada',
        'cita_rechazada',
        'propuesta_fecha',
        'cita_cancelada',
        'recordatorio',
        'cita_completada'
    )),
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,

    leida BOOLEAN DEFAULT false,
    fecha_leida TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_cita ON notificaciones(cita_id);

-- ============================================================================
-- TABLA: estadisticas_citas
-- ============================================================================

CREATE TABLE IF NOT EXISTS estadisticas_citas (
    id SERIAL PRIMARY KEY,
    orientador_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,

    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,

    total_citas INTEGER DEFAULT 0,
    citas_completadas INTEGER DEFAULT 0,
    citas_canceladas INTEGER DEFAULT 0,
    citas_no_asistio INTEGER DEFAULT 0,

    tiempo_promedio_respuesta_minutos INTEGER,
    duracion_promedio_minutos INTEGER,

    generado_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_orientador_periodo UNIQUE (orientador_id, periodo_inicio, periodo_fin)
);

-- ============================================================================
-- TABLA: password_reset_tokens (recuperación de contraseñas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    expira_en TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usado_en TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_expira_en ON password_reset_tokens(expira_en);
CREATE INDEX IF NOT EXISTS idx_usuario_id ON password_reset_tokens(usuario_id);

-- ============================================================================
-- TABLA: audit_log (auditoría de seguridad)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    email VARCHAR(255),
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(50),
    entidad_id INTEGER,
    detalles JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    resultado VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_usuario_id ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_accion ON audit_log(accion);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resultado ON audit_log(resultado);
CREATE INDEX IF NOT EXISTS idx_audit_log_email ON audit_log(email);

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_usuarios_updated_at ON usuarios;
CREATE TRIGGER trigger_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_citas_updated_at ON citas;
CREATE TRIGGER trigger_citas_updated_at
    BEFORE UPDATE ON citas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_disponibilidad_updated_at ON disponibilidad_orientadores;
CREATE TRIGGER trigger_disponibilidad_updated_at
    BEFORE UPDATE ON disponibilidad_orientadores
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE OR REPLACE FUNCTION crear_notificacion_cita()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notificaciones (usuario_id, cita_id, tipo, titulo, mensaje)
    VALUES (
        NEW.orientador_id,
        NEW.id,
        'cita_solicitada',
        'Nueva solicitud de cita',
        'Tienes una nueva solicitud de cita pendiente de revisión'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notificacion_nueva_cita ON citas;
CREATE TRIGGER trigger_notificacion_nueva_cita
    AFTER INSERT ON citas
    FOR EACH ROW
    EXECUTE FUNCTION crear_notificacion_cita();

-- ============================================================================
-- DATOS INICIALES (hashes placeholder — se actualizan después con bcrypt real)
-- ============================================================================

INSERT INTO usuarios (email, nombre, apellido, password_hash, tipo, priv_dspace, priv_koha_staff, priv_koha_opac, priv_admin)
VALUES
    ('admin@biblioteca.local', 'Admin', 'Sistema', 'PENDIENTE_HASH', 'administrador', true, true, true, true),
    ('marcos@biblioteca.local', 'Marcos', 'Administrador', 'PENDIENTE_HASH', 'administrador', true, true, true, true),
    ('maria.garcia@estudiante.local', 'María', 'García', 'PENDIENTE_HASH', 'estudiante', true, false, true, false),
    ('alumno@biblioteca.local', 'Juan', 'Pérez', 'PENDIENTE_HASH', 'estudiante', true, false, true, false)
ON CONFLICT (email) DO NOTHING;

INSERT INTO usuarios (email, nombre, apellido, password_hash, tipo, especialidad, telefono, biografia, priv_dspace, priv_koha_opac)
VALUES
    ('psic.ramirez@henm.edu.mx', 'Laura', 'Ramírez', 'PENDIENTE_HASH', 'orientador', 'Psicología Clínica', '555-0101',
     'Psicóloga especializada en orientación educativa con 10 años de experiencia.', true, true),
    ('psic.martinez@henm.edu.mx', 'Carlos', 'Martínez', 'PENDIENTE_HASH', 'orientador', 'Orientación Vocacional', '555-0102',
     'Orientador vocacional con maestría en desarrollo de carrera profesional.', true, true),
    ('psic.lopez@henm.edu.mx', 'Ana', 'López', 'PENDIENTE_HASH', 'orientador', 'Psicopedagogía', '555-0103',
     'Especialista en dificultades de aprendizaje y apoyo académico.', true, true)
ON CONFLICT (email) DO NOTHING;

DO $$
DECLARE
    orientador_record RECORD;
    dia INTEGER;
BEGIN
    FOR orientador_record IN SELECT id FROM usuarios WHERE tipo = 'orientador' LOOP
        FOR dia IN 1..5 LOOP
            INSERT INTO disponibilidad_orientadores (orientador_id, dia_semana, hora_inicio, hora_fin)
            VALUES
                (orientador_record.id, dia, '09:00:00', '12:00:00'),
                (orientador_record.id, dia, '14:00:00', '17:00:00')
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- VISTAS
-- ============================================================================

CREATE OR REPLACE VIEW vista_citas_completa AS
SELECT
    c.id,
    c.uuid,
    c.fecha_hora,
    c.duracion_minutos,
    c.modalidad,
    c.ubicacion,
    c.motivo,
    c.estado,
    e.id as estudiante_id,
    e.nombre as estudiante_nombre,
    e.apellido as estudiante_apellido,
    e.email as estudiante_email,
    o.id as orientador_id,
    o.nombre as orientador_nombre,
    o.apellido as orientador_apellido,
    o.email as orientador_email,
    o.especialidad as orientador_especialidad,
    c.created_at,
    c.updated_at
FROM citas c
INNER JOIN usuarios e ON c.estudiante_id = e.id
INNER JOIN usuarios o ON c.orientador_id = o.id;

CREATE OR REPLACE VIEW vista_estadisticas_orientadores AS
SELECT
    u.id,
    u.nombre,
    u.apellido,
    u.email,
    u.especialidad,
    COUNT(c.id) as total_citas,
    COUNT(CASE WHEN c.estado = 'completada' THEN 1 END) as citas_completadas,
    COUNT(CASE WHEN c.estado = 'pendiente' THEN 1 END) as citas_pendientes,
    COUNT(CASE WHEN c.estado = 'aceptada' THEN 1 END) as citas_aceptadas,
    COUNT(CASE WHEN c.estado = 'cancelada_estudiante' THEN 1 END) as citas_canceladas
FROM usuarios u
LEFT JOIN citas c ON u.id = c.orientador_id
WHERE u.tipo = 'orientador' AND u.activo = true
GROUP BY u.id, u.nombre, u.apellido, u.email, u.especialidad;

-- ============================================================================
-- FIN
-- ============================================================================
