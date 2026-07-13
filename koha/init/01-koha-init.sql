-- Inicialización de base de datos para Koha
-- Este script se ejecuta cuando se crea la base de datos

-- Configurar charset y collation
SET NAMES utf8mb4;
SET character_set_client = utf8mb4;

-- Crear usuario adicional si es necesario
CREATE USER IF NOT EXISTS 'koha_admin'@'%' IDENTIFIED BY 'koha_admin_password';
GRANT ALL PRIVILEGES ON koha_biblioteca.* TO 'koha_admin'@'%';

-- Configuraciones específicas de MySQL/MariaDB para Koha
-- (innodb_file_format e innodb_large_prefix se eliminaron en MariaDB 10.6+;
--  innodb_file_per_table ya es el default)
SET GLOBAL max_allowed_packet = 1073741824;

FLUSH PRIVILEGES;

-- Log de inicialización
SELECT 'Base de datos Koha inicializada correctamente' as status;
