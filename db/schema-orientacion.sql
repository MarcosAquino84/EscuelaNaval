-- ============================================================================
-- ESQUEMA DE BASE DE DATOS - MÓDULO DE ORIENTACIÓN EDUCATIVA
-- Sistema de Biblioteca Digital HENM
-- ============================================================================

-- Crear base de datos para el sistema de autenticación y orientación
CREATE DATABASE IF NOT EXISTS biblioteca_auth;

\c biblioteca_auth;

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLA: usuarios
-- Gestión centralizada de usuarios del sistema
-- ============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('administrador', 'estudiante', 'orientador')),

    -- Privilegios de acceso a sistemas
    priv_dspace BOOLEAN DEFAULT false,
    priv_koha_staff BOOLEAN DEFAULT false,
    priv_koha_opac BOOLEAN DEFAULT false,
    priv_admin BOOLEAN DEFAULT false,

    -- Datos adicionales para orientadores
    especialidad VARCHAR(100), -- Psicología, Orientación Vocacional, etc.
    telefono VARCHAR(20),
    biografia TEXT,

    -- Metadata
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    ultimo_acceso TIMESTAMP
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- ============================================================================
-- TABLA: citas
-- Gestión de citas entre estudiantes y orientadores
-- ============================================================================

CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,

    -- Relaciones
    estudiante_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    orientador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Información de la cita
    fecha_hora TIMESTAMP NOT NULL,
    duracion_minutos INTEGER DEFAULT 60 CHECK (duracion_minutos > 0),
    modalidad VARCHAR(50) DEFAULT 'presencial' CHECK (modalidad IN ('presencial', 'virtual', 'telefonica')),
    ubicacion VARCHAR(255), -- Sala, oficina, link de zoom, etc.

    -- Contenido
    motivo TEXT NOT NULL,
    descripcion_estudiante TEXT,

    -- Estado de la cita
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

    -- Notas y seguimiento
    notas_orientador TEXT, -- Visibles para el estudiante
    notas_privadas TEXT,   -- Solo para el orientador
    motivo_rechazo TEXT,
    motivo_cancelacion TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    fecha_completada TIMESTAMP,

    -- Validaciones
    CONSTRAINT chk_fecha_futura CHECK (fecha_hora > created_at),
    CONSTRAINT chk_diferentes_usuarios CHECK (estudiante_id != orientador_id)
);

-- Índices para consultas frecuentes
CREATE INDEX idx_citas_estudiante ON citas(estudiante_id);
CREATE INDEX idx_citas_orientador ON citas(orientador_id);
CREATE INDEX idx_citas_estado ON citas(estado);
CREATE INDEX idx_citas_fecha_hora ON citas(fecha_hora);
CREATE INDEX idx_citas_orientador_fecha ON citas(orientador_id, fecha_hora);

-- ============================================================================
-- TABLA: propuestas_fecha
-- Historial de propuestas de cambio de fecha/hora
-- ============================================================================

CREATE TABLE IF NOT EXISTS propuestas_fecha (
    id SERIAL PRIMARY KEY,
    cita_id INTEGER NOT NULL REFERENCES citas(id) ON DELETE CASCADE,

    -- Propuesta
    fecha_hora_original TIMESTAMP NOT NULL,
    fecha_hora_propuesta TIMESTAMP NOT NULL,
    propuesta_por INTEGER NOT NULL REFERENCES usuarios(id),
    mensaje TEXT,

    -- Estado de la propuesta
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',
        'aceptada',
        'rechazada'
    )),

    -- Respuesta
    respondida_por INTEGER REFERENCES usuarios(id),
    fecha_respuesta TIMESTAMP,
    mensaje_respuesta TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_propuestas_cita ON propuestas_fecha(cita_id);
CREATE INDEX idx_propuestas_estado ON propuestas_fecha(estado);

-- ============================================================================
-- TABLA: disponibilidad_orientadores
-- Horarios disponibles de cada orientador
-- ============================================================================

CREATE TABLE IF NOT EXISTS disponibilidad_orientadores (
    id SERIAL PRIMARY KEY,
    orientador_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),

    -- Horario
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,

    -- Estado
    activo BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Validaciones
    CONSTRAINT chk_horario_valido CHECK (hora_fin > hora_inicio),
    CONSTRAINT unique_orientador_dia_horario UNIQUE (orientador_id, dia_semana, hora_inicio, hora_fin)
);

-- Índices
CREATE INDEX idx_disponibilidad_orientador ON disponibilidad_orientadores(orientador_id);
CREATE INDEX idx_disponibilidad_dia ON disponibilidad_orientadores(dia_semana);
CREATE INDEX idx_disponibilidad_activo ON disponibilidad_orientadores(activo);

-- ============================================================================
-- TABLA: notificaciones
-- Sistema de notificaciones para citas y eventos
-- ============================================================================

CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cita_id INTEGER REFERENCES citas(id) ON DELETE CASCADE,

    -- Contenido
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

    -- Estado
    leida BOOLEAN DEFAULT false,
    fecha_leida TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_cita ON notificaciones(cita_id);

-- ============================================================================
-- TABLA: estadisticas_citas
-- Tabla materializada para reportes y estadísticas
-- ============================================================================

CREATE TABLE IF NOT EXISTS estadisticas_citas (
    id SERIAL PRIMARY KEY,
    orientador_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Período
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,

    -- Contadores
    total_citas INTEGER DEFAULT 0,
    citas_completadas INTEGER DEFAULT 0,
    citas_canceladas INTEGER DEFAULT 0,
    citas_no_asistio INTEGER DEFAULT 0,

    -- Promedios
    tiempo_promedio_respuesta_minutos INTEGER,
    duracion_promedio_minutos INTEGER,

    -- Metadata
    generado_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_orientador_periodo UNIQUE (orientador_id, periodo_inicio, periodo_fin)
);

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para usuarios
CREATE TRIGGER trigger_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- Trigger para citas
CREATE TRIGGER trigger_citas_updated_at
    BEFORE UPDATE ON citas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- Trigger para disponibilidad
CREATE TRIGGER trigger_disponibilidad_updated_at
    BEFORE UPDATE ON disponibilidad_orientadores
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- Función para crear notificación automática al crear cita
CREATE OR REPLACE FUNCTION crear_notificacion_cita()
RETURNS TRIGGER AS $$
BEGIN
    -- Notificar al orientador de nueva solicitud
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

-- Trigger para crear notificación al solicitar cita
CREATE TRIGGER trigger_notificacion_nueva_cita
    AFTER INSERT ON citas
    FOR EACH ROW
    EXECUTE FUNCTION crear_notificacion_cita();

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Insertar usuarios de ejemplo
INSERT INTO usuarios (email, nombre, apellido, password_hash, tipo, priv_dspace, priv_koha_staff, priv_koha_opac, priv_admin)
VALUES
    ('admin@biblioteca.local', 'Admin', 'Sistema', '$2a$10$admin123hash', 'administrador', true, true, true, true),
    ('marcos@biblioteca.local', 'Marcos', 'Administrador', '$2a$10$marcos123hash', 'administrador', true, true, true, true),
    ('maria.garcia@estudiante.local', 'María', 'García', '$2a$10$estudiante123hash', 'estudiante', true, false, true, false),
    ('alumno@biblioteca.local', 'Juan', 'Pérez', '$2a$10$alumno123hash', 'estudiante', true, false, true, false)
ON CONFLICT (email) DO NOTHING;

-- Insertar orientadores de ejemplo
INSERT INTO usuarios (email, nombre, apellido, password_hash, tipo, especialidad, telefono, biografia, priv_dspace, priv_koha_opac)
VALUES
    ('psic.ramirez@henm.edu.mx', 'Laura', 'Ramírez', '$2a$10$orientador123hash', 'orientador', 'Psicología Clínica', '555-0101',
     'Psicóloga especializada en orientación educativa con 10 años de experiencia.', true, true),
    ('psic.martinez@henm.edu.mx', 'Carlos', 'Martínez', '$2a$10$orientador123hash', 'orientador', 'Orientación Vocacional', '555-0102',
     'Orientador vocacional con maestría en desarrollo de carrera profesional.', true, true),
    ('psic.lopez@henm.edu.mx', 'Ana', 'López', '$2a$10$orientador123hash', 'orientador', 'Psicopedagogía', '555-0103',
     'Especialista en dificultades de aprendizaje y apoyo académico.', true, true)
ON CONFLICT (email) DO NOTHING;

-- Insertar disponibilidad para orientadores (Lunes a Viernes, 9:00 - 17:00)
DO $$
DECLARE
    orientador_record RECORD;
    dia INTEGER;
BEGIN
    FOR orientador_record IN SELECT id FROM usuarios WHERE tipo = 'orientador' LOOP
        FOR dia IN 1..5 LOOP -- Lunes a Viernes
            INSERT INTO disponibilidad_orientadores (orientador_id, dia_semana, hora_inicio, hora_fin)
            VALUES
                (orientador_record.id, dia, '09:00:00', '12:00:00'),
                (orientador_record.id, dia, '14:00:00', '17:00:00')
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista de citas con información completa
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
    -- Estudiante
    e.id as estudiante_id,
    e.nombre as estudiante_nombre,
    e.apellido as estudiante_apellido,
    e.email as estudiante_email,
    -- Orientador
    o.id as orientador_id,
    o.nombre as orientador_nombre,
    o.apellido as orientador_apellido,
    o.email as orientador_email,
    o.especialidad as orientador_especialidad,
    -- Metadata
    c.created_at,
    c.updated_at
FROM citas c
INNER JOIN usuarios e ON c.estudiante_id = e.id
INNER JOIN usuarios o ON c.orientador_id = o.id;

-- Vista de estadísticas por orientador
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
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- ============================================================================

COMMENT ON TABLE usuarios IS 'Usuarios del sistema (estudiantes, orientadores, administradores)';
COMMENT ON TABLE citas IS 'Citas de orientación educativa entre estudiantes y orientadores';
COMMENT ON TABLE propuestas_fecha IS 'Propuestas de cambio de fecha/hora para citas';
COMMENT ON TABLE disponibilidad_orientadores IS 'Horarios disponibles de orientadores';
COMMENT ON TABLE notificaciones IS 'Sistema de notificaciones para usuarios';
COMMENT ON TABLE estadisticas_citas IS 'Estadísticas agregadas de citas por período';

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================
