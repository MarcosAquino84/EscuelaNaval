# ============================================================================
# Exportar los datos del sistema LOCAL para migrarlos al servidor.
# Se corre en Windows con el stack local encendido:
#   powershell -ExecutionPolicy Bypass -File .\deploy\exportar-datos.ps1
# Genera deploy/backup/ con: biblioteca_auth.sql, koha.sql, dspace.sql,
# assetstore.tar.gz (archivos subidos a DSpace)
# ============================================================================

$ErrorActionPreference = 'Stop'
$backup = Join-Path $PSScriptRoot 'backup'
New-Item -ItemType Directory -Force $backup | Out-Null

# Los dumps se generan DENTRO del contenedor y se extraen con docker cp:
# el pipeline de PowerShell re-codifica el texto y corrompe acentos/ñ.

Write-Host "[1/4] PostgreSQL: biblioteca_auth (usuarios, citas)..." -ForegroundColor Cyan
docker exec dspacedb sh -c 'pg_dump -U dspace -d biblioteca_auth --clean --if-exists > /tmp/ba.sql'
docker cp dspacedb:/tmp/ba.sql "$backup\biblioteca_auth.sql"

Write-Host "[2/4] PostgreSQL: dspace (repositorio)..." -ForegroundColor Cyan
docker exec dspacedb sh -c 'pg_dump -U dspace -d dspace --clean --if-exists > /tmp/ds.sql'
docker cp dspacedb:/tmp/ds.sql "$backup\dspace.sql"
docker exec dspacedb rm -f /tmp/ba.sql /tmp/ds.sql

Write-Host "[3/4] MariaDB: koha_biblioteca (catalogo, ejemplares, usuarios Koha)..." -ForegroundColor Cyan
docker exec koha-mariadb sh -c 'mariadb-dump -u root -p"$MYSQL_ROOT_PASSWORD" --databases koha_biblioteca > /tmp/koha.sql'
docker cp koha-mariadb:/tmp/koha.sql "$backup\koha.sql"
docker exec koha-mariadb rm -f /tmp/koha.sql

Write-Host "[4/4] DSpace assetstore (archivos subidos)..." -ForegroundColor Cyan
docker exec dspace tar czf /tmp/assetstore.tar.gz -C /dspace assetstore
docker cp dspace:/tmp/assetstore.tar.gz "$backup\assetstore.tar.gz"
docker exec dspace rm -f /tmp/assetstore.tar.gz

Write-Host ""
Get-ChildItem $backup | Select-Object Name, @{n='MB';e={[math]::Round($_.Length/1MB,2)}}
Write-Host ""
Write-Host "Respaldo completo en deploy\backup\. Copiarlo al servidor junto con el proyecto." -ForegroundColor Green
