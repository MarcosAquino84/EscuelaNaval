-- ============================================================================
-- TABLA DE AUDITORÍA - Registro de eventos de seguridad
-- ============================================================================
-- Ejecutar después de crear la base de datos biblioteca_auth

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    email VARCHAR(255),  -- Guardamos email por si el usuario se elimina
    accion VARCHAR(100) NOT NULL,  -- Tipo de acción (login, logout, create_user, etc.)
    entidad VARCHAR(50),  -- Entidad afectada (usuario, password, privilegios, etc.)
    entidad_id INTEGER,  -- ID de la entidad afectada
    detalles JSONB,  -- Detalles adicionales en formato JSON
    ip_address VARCHAR(45),  -- IPv4 o IPv6
    user_agent TEXT,  -- Información del navegador
    resultado VARCHAR(20) DEFAULT 'success',  -- success, failure, error
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_audit_log_usuario_id ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_accion ON audit_log(accion);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resultado ON audit_log(resultado);
CREATE INDEX IF NOT EXISTS idx_audit_log_email ON audit_log(email);

-- Comentarios para documentación
COMMENT ON TABLE audit_log IS 'Registro de auditoría de eventos de seguridad del sistema';
COMMENT ON COLUMN audit_log.accion IS 'Tipo de acción: login, logout, create_user, update_user, delete_user, change_password, etc.';
COMMENT ON COLUMN audit_log.resultado IS 'Resultado de la acción: success, failure, error';
COMMENT ON COLUMN audit_log.detalles IS 'Información adicional en formato JSON (sin datos sensibles)';
