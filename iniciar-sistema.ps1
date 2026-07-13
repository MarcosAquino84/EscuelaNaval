# ============================================================================
# Iniciar Biblioteca Digital HENM (Docker Desktop + ngrok) - Windows
# Reemplaza a los scripts .sh del entorno WSL anterior.
# Uso:  powershell -ExecutionPolicy Bypass -File .\iniciar-sistema.ps1
# ============================================================================

$ErrorActionPreference = 'Continue'
$proyecto = $PSScriptRoot
$ngrokExe = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"
$dominio = "pouch-earwig-boxy.ngrok-free.dev"

Write-Host "=== Biblioteca Digital HENM ===" -ForegroundColor Cyan

# 1. Verificar que Docker Desktop este corriendo
docker version 2>&1 | Out-Null
if (-not $?) {
    Write-Host "Docker no responde. Abriendo Docker Desktop..." -ForegroundColor Yellow
    Start-Process "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
    do { Start-Sleep 5; docker version 2>&1 | Out-Null } until ($?)
}
Write-Host "Docker OK" -ForegroundColor Green

# 2. Levantar todos los servicios
Set-Location $proyecto
docker compose up -d
Write-Host "Contenedores levantados" -ForegroundColor Green

# 3. Tunel ngrok hacia el panel (8088) con dominio fijo
$yaCorre = Get-Process ngrok -ErrorAction SilentlyContinue
if (-not $yaCorre) {
    Start-Process -FilePath $ngrokExe -ArgumentList "http", "--url=$dominio", "8088" -WindowStyle Hidden
    Start-Sleep 5
}
Write-Host "ngrok activo" -ForegroundColor Green

Write-Host ""
Write-Host "URLs del sistema:" -ForegroundColor Cyan
Write-Host "  Panel (publico):  https://$dominio"
Write-Host "  Panel (local):    http://localhost:8088"
Write-Host "  DSpace:           http://localhost:4000"
Write-Host "  Koha OPAC:        http://localhost:8082"
Write-Host "  Koha Staff:       http://localhost:8101"
Write-Host ""
Write-Host "Nota: DSpace tarda 2-3 minutos en estar listo tras el arranque." -ForegroundColor Yellow
