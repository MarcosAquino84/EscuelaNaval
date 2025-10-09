#!/bin/bash

echo "========================================="
echo "  Deteniendo Biblioteca Digital"
echo "========================================="

# Detener los servicios
docker compose down

echo ""
echo "Servicios detenidos correctamente."
echo ""
echo "Para eliminar también los volúmenes de datos, ejecuta:"
echo "  docker compose down -v"
echo ""