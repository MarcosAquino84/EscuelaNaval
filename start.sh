#!/bin/bash

echo "========================================="
echo "  Iniciando Biblioteca Digital con DSpace"
echo "========================================="

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Error: Docker no está instalado"
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose no está instalado"
    exit 1
fi

# Crear directorios necesarios si no existen
echo "Creando directorios necesarios..."
mkdir -p dspace/{config,data,logs,solr}
mkdir -p postgresql/data
mkdir -p scripts

# Establecer permisos
chmod -R 755 dspace
chmod -R 755 postgresql

# Iniciar los servicios
echo "Iniciando servicios con Docker Compose..."
docker compose up -d

# Esperar a que los servicios estén listos
echo "Esperando a que los servicios estén listos..."
sleep 10

# Verificar el estado de los servicios
echo ""
echo "Estado de los servicios:"
docker compose ps

echo ""
echo "========================================="
echo "  DSpace está iniciándose..."
echo "========================================="
echo ""
echo "URLs de acceso:"
echo "  - Frontend (Angular): http://localhost:4000"
echo "  - Backend (REST API): http://localhost:8080/server"
echo "  - Solr Admin: http://localhost:8983/solr"
echo ""
echo "Nota: DSpace puede tardar 2-3 minutos en estar completamente listo."
echo "Puedes verificar los logs con: docker compose logs -f"
echo ""