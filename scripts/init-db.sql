-- Script de inicialización para DSpace PostgreSQL
-- Este script se ejecuta automáticamente cuando el contenedor se crea por primera vez

-- Configurar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Configurar el esquema por defecto
ALTER DATABASE dspace SET search_path TO public;

-- Permisos para el usuario dspace
GRANT ALL PRIVILEGES ON DATABASE dspace TO dspace;
GRANT ALL PRIVILEGES ON SCHEMA public TO dspace;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Base de datos DSpace inicializada correctamente';
END
$$;