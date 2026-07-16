#!/bin/bash
# ============================================================================
# Importar en el SERVIDOR los datos exportados de la máquina local.
# Requiere el stack ya levantado y deploy/backup/ presente.
#   bash /opt/biblioteca/deploy/importar-datos.sh
# ============================================================================
set -e
cd /opt/biblioteca
BACKUP=deploy/backup
DC="sudo docker"

[ -d "$BACKUP" ] || { echo "No existe $BACKUP"; exit 1; }

echo "== [1/6] Esperando a PostgreSQL y MariaDB =="
until $DC exec dspacedb pg_isready -U dspace >/dev/null 2>&1; do sleep 3; done
until $DC exec koha-mariadb mariadb-admin ping --silent >/dev/null 2>&1; do sleep 3; done

echo "== [2/6] biblioteca_auth (usuarios, citas) =="
$DC exec dspacedb psql -U dspace -tc "SELECT 1 FROM pg_database WHERE datname='biblioteca_auth'" | grep -q 1 \
    || $DC exec dspacedb psql -U dspace -c "CREATE DATABASE biblioteca_auth"
$DC exec -i dspacedb psql -U dspace -d biblioteca_auth < "$BACKUP/biblioteca_auth.sql" >/dev/null
echo "   OK"

echo "== [3/6] Base de datos de DSpace =="
$DC exec -i dspacedb psql -U dspace -d dspace < "$BACKUP/dspace.sql" >/dev/null
echo "   OK"

echo "== [4/6] Base de datos de Koha =="
$DC exec -i koha-mariadb sh -c 'mariadb -u root -p"$MYSQL_ROOT_PASSWORD"' < "$BACKUP/koha.sql"
echo "   OK"

echo "== [5/6] Archivos de DSpace (assetstore) =="
$DC cp "$BACKUP/assetstore.tar.gz" dspace:/tmp/assetstore.tar.gz
$DC exec dspace tar xzf /tmp/assetstore.tar.gz -C /dspace
$DC exec dspace rm -f /tmp/assetstore.tar.gz
echo "   OK"

echo "== [6/6] Reindexar y reiniciar =="
# Koha: URLs públicas + reindexar catálogo
source deploy/.env.prod
$DC exec koha bash -c "echo \"UPDATE systempreferences SET value='https://catalogo.$DOMAIN' WHERE variable='OPACBaseURL'; UPDATE systempreferences SET value='https://staff.$DOMAIN' WHERE variable='staffClientBaseURL';\" | koha-mysql biblioteca" || true
$DC exec koha koha-rebuild-zebra -f biblioteca || true
# DSpace: reindexar descubrimiento
$DC exec dspace /dspace/bin/dspace index-discovery -b || true
# Reiniciar servicios que cachean
$DC restart auth-service koha koha-memcached dspace-angular

echo ""
echo "Migración completa. Verificar:"
echo "  https://biblioteca.$DOMAIN   (panel)"
echo "  https://catalogo.$DOMAIN     (OPAC)"
echo "  https://staff.$DOMAIN        (Koha staff)"
echo "  https://repositorio.$DOMAIN  (DSpace)"
