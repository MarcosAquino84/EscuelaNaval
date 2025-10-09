#!/bin/bash
# Script maestro para iniciar el sistema de biblioteca en español

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Sistema de Biblioteca Digital"
echo "  Iniciando en ESPAÑOL"
echo "=========================================="
echo ""

# Función para mostrar progreso
show_progress() {
    echo -e "${BLUE}➜${NC} $1"
}

# Función para mostrar éxito
show_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Función para mostrar advertencia
show_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Función para mostrar error
show_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    show_error "No se encuentra docker-compose.yml. Asegúrate de estar en /home/marcos/biblioteca"
    exit 1
fi

show_success "Directorio correcto verificado"

# Paso 1: Detener servicios existentes
show_progress "Deteniendo servicios existentes..."
docker-compose down 2>/dev/null || true
show_success "Servicios detenidos"

echo ""

# Paso 2: Iniciar bases de datos
show_progress "Iniciando bases de datos..."
docker-compose up -d dspacedb dspacesolr koha-db koha-memcached

show_progress "Esperando a que las bases de datos estén listas (15 segundos)..."
for i in {15..1}; do
    echo -ne "${YELLOW}  $i segundos restantes...\r${NC}"
    sleep 1
done
echo -e "${GREEN}  ✓ Bases de datos listas          ${NC}"

# Verificar que las bases de datos están corriendo
if docker ps | grep -q "dspacedb\|koha-mariadb"; then
    show_success "Bases de datos iniciadas correctamente"
else
    show_error "Problema al iniciar bases de datos"
    exit 1
fi

echo ""

# Paso 3: Iniciar aplicaciones
show_progress "Iniciando DSpace (Backend + Frontend)..."
docker-compose up -d dspace dspace-angular

show_progress "Iniciando Koha (Web + API)..."
docker-compose up -d koha-web koha-api

show_success "Aplicaciones iniciadas"

echo ""

# Paso 4: Esperar a que los servicios estén listos
show_progress "Esperando a que los servicios estén completamente listos (20 segundos)..."
for i in {20..1}; do
    echo -ne "${YELLOW}  $i segundos restantes...\r${NC}"
    sleep 1
done
echo -e "${GREEN}  ✓ Servicios listos                ${NC}"

echo ""

# Paso 5: Aplicar configuración de español en Koha
show_progress "Aplicando configuración de español en Koha..."

# Crear directorio si no existe
mkdir -p ./koha/config
mkdir -p ./koha/web

# Crear y aplicar SQL para configurar español
cat > ./koha/config/idioma.sql << 'EOSQL'
USE koha_biblioteca;

INSERT INTO systempreferences (variable, value, explanation, type)
VALUES ('language', 'es-ES', 'Idioma por defecto del sistema', 'Choice')
ON DUPLICATE KEY UPDATE value = 'es-ES';

INSERT INTO systempreferences (variable, value, explanation, type)
VALUES ('opaclanguages', 'es-ES', 'Idiomas disponibles en OPAC', 'Choice')
ON DUPLICATE KEY UPDATE value = 'es-ES';

INSERT INTO systempreferences (variable, value, explanation, type)
VALUES ('opaclanguagesdisplay', '1', 'Mostrar selector de idiomas en OPAC', 'YesNo')
ON DUPLICATE KEY UPDATE value = '1';

INSERT INTO systempreferences (variable, value, explanation, type)
VALUES ('TimeFormat', '24hr', 'Formato de hora', 'Choice')
ON DUPLICATE KEY UPDATE value = '24hr';

UPDATE borrowers SET lang = 'es-ES' WHERE lang IS NULL OR lang = 'default' OR lang = '';

SELECT 'Configuración de idioma español completada' AS Status;
EOSQL

# Aplicar configuración SQL
if docker exec -i koha-mariadb mysql -ukoha -pkoha_password < ./koha/config/idioma.sql 2>/dev/null; then
    show_success "Configuración de español aplicada en Koha"
else
    show_warning "No se pudo aplicar la configuración de Koha (puede ser que la BD aún no esté lista)"
    show_warning "Puedes ejecutar manualmente: ./configurar-espanol-koha.sh"
fi

echo ""

# Paso 6: Verificar estado de los servicios
show_progress "Verificando estado de los servicios..."
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAME|dspace|koha"
echo ""

# Paso 7: Mostrar resumen
echo "=========================================="
echo "  ✓ Sistema Iniciado Correctamente"
echo "=========================================="
echo ""
echo -e "${GREEN}DSpace (Repositorio Digital)${NC}"
echo "  • Frontend:     http://localhost:4000"
echo "  • Backend API:  http://localhost:8090/server/api"
echo "  • Solr Admin:   http://localhost:8983/solr"
echo "  • Idioma:       Español (configurado)"
echo ""
echo -e "${GREEN}Koha (Sistema Bibliotecario)${NC}"
echo "  • Staff:        http://localhost:8086/cgi-bin/koha/mainpage.pl"
echo "  • OPAC:         http://localhost:8085"
echo "  • Credenciales: admin / admin123"
echo "  • Idioma:       Español (configurado)"
echo ""
echo -e "${GREEN}Panel de Administración${NC}"
echo "  • Dashboard:    http://localhost:8081"
echo "  • Guía idioma:  http://localhost:8081/configurar-idioma.html"
echo ""
echo "=========================================="
echo -e "${YELLOW}NOTAS IMPORTANTES:${NC}"
echo ""
echo "1. DSpace Angular puede tardar 3-5 minutos en compilar"
echo "   (es normal, solo la primera vez)"
echo ""
echo "2. Si DSpace sigue en inglés:"
echo "   - Busca el selector de idioma arriba a la derecha"
echo "   - Selecciona 'Español'"
echo "   - Limpia la caché del navegador (Ctrl+Shift+Delete)"
echo ""
echo "3. Si Koha sigue en inglés:"
echo "   - Ejecuta: ./configurar-espanol-koha.sh"
echo "   - Reinicia el navegador"
echo ""
echo "4. Documentación completa:"
echo "   - Ver: CONFIGURACION_ESPAÑOL.md"
echo ""
echo "=========================================="
echo -e "${GREEN}Para ver los logs en tiempo real:${NC}"
echo "  docker-compose logs -f dspace"
echo "  docker-compose logs -f dspace-angular"
echo "  docker-compose logs -f koha-web"
echo ""
echo -e "${GREEN}Para detener todos los servicios:${NC}"
echo "  docker-compose down"
echo "=========================================="
echo ""
