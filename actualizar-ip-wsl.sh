#!/bin/bash
# Script para actualizar automáticamente la IP de WSL en docker-compose.yml

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "  Actualizar IP de WSL en DSpace"
echo "=========================================="
echo ""

# Obtener la IP actual de WSL
NEW_IP=$(hostname -I | awk '{print $1}')

if [ -z "$NEW_IP" ]; then
    echo -e "${RED}✗${NC} No se pudo obtener la IP de WSL"
    exit 1
fi

echo -e "${GREEN}✓${NC} IP de WSL detectada: ${BLUE}$NEW_IP${NC}"

# Detectar la IP antigua en docker-compose.yml
OLD_IP=$(grep -oP 'DSPACE_REST_HOST.*\K\d+\.\d+\.\d+\.\d+' docker-compose.yml | head -1)

if [ -z "$OLD_IP" ]; then
    echo -e "${YELLOW}⚠${NC} No se encontró IP previa, asumiendo primera configuración"
    OLD_IP="localhost"
fi

echo -e "${BLUE}➜${NC} IP anterior: ${OLD_IP}"

# Si las IPs son iguales, no hacer nada
if [ "$OLD_IP" == "$NEW_IP" ]; then
    echo -e "${GREEN}✓${NC} La IP no ha cambiado. No es necesario actualizar."
    echo ""
    echo "Accede a DSpace en: ${BLUE}http://$NEW_IP:4000${NC}"
    exit 0
fi

# Hacer backup del docker-compose.yml actual
BACKUP_FILE="docker-compose.yml.backup-$(date +%Y%m%d-%H%M%S)"
cp docker-compose.yml "$BACKUP_FILE"
echo -e "${GREEN}✓${NC} Backup creado: $BACKUP_FILE"

# Actualizar todas las instancias de la IP en docker-compose.yml
echo -e "${BLUE}➜${NC} Actualizando docker-compose.yml..."

# Reemplazar en las URLs del servidor
sed -i "s|http://$OLD_IP:8090|http://$NEW_IP:8090|g" docker-compose.yml
sed -i "s|http://$OLD_IP:4000|http://$NEW_IP:4000|g" docker-compose.yml

# Reemplazar en DSPACE_REST_HOST
sed -i "s|DSPACE_REST_HOST: '$OLD_IP'|DSPACE_REST_HOST: '$NEW_IP'|g" docker-compose.yml

# Actualizar el rango de IPs confiables
IP_PREFIX=$(echo $NEW_IP | cut -d'.' -f1-2)
sed -i "s|proxies__P__trusted__P__ipranges:.*|proxies__P__trusted__P__ipranges: '172.23.0, ${IP_PREFIX}.0'|g" docker-compose.yml

echo -e "${GREEN}✓${NC} docker-compose.yml actualizado"

# Reiniciar servicios
echo ""
echo -e "${BLUE}➜${NC} Reiniciando servicios DSpace..."
docker-compose restart dspace dspace-angular

echo -e "${GREEN}✓${NC} Servicios reiniciados"

# Esperar un momento
echo ""
echo -e "${YELLOW}⏱${NC} Esperando a que Angular recompile (esto toma 2-3 minutos)..."
echo -e "   Puedes ver el progreso con: ${BLUE}docker logs -f dspace-angular${NC}"

# Mostrar resumen
echo ""
echo "=========================================="
echo "  Actualización Completada"
echo "=========================================="
echo ""
echo -e "${GREEN}IP anterior:${NC} $OLD_IP"
echo -e "${GREEN}IP nueva:${NC}    $NEW_IP"
echo ""
echo -e "${GREEN}Accede a DSpace desde Windows en:${NC}"
echo -e "  🌐 DSpace:      ${BLUE}http://$NEW_IP:4000${NC}"
echo -e "  📡 API:         ${BLUE}http://$NEW_IP:8090/server/api${NC}"
echo -e "  🏠 Panel Admin: ${BLUE}http://$NEW_IP:8081${NC}"
echo ""
echo -e "${YELLOW}Nota:${NC} Espera 2-3 minutos para que Angular termine de compilar"
echo -e "      antes de intentar acceder desde el navegador."
echo ""
echo "=========================================="
