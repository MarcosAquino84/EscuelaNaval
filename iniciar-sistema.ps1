# ============================================================================
# BIBLIOTECA DIGITAL HENM - Arranque completo del sistema
# Levanta: Docker Desktop + contenedores (Koha, DSpace, auth, panel) + ngrok
# Uso:  powershell -ExecutionPolicy Bypass -File .\iniciar-sistema.ps1
#       (o clic derecho -> Ejecutar con PowerShell)
# Es idempotente: si algo ya esta corriendo, lo detecta y no lo duplica.
# ============================================================================

$ErrorActionPreference = 'Continue'
$proyecto = $PSScriptRoot
$dominio = "pouch-earwig-boxy.ngrok-free.dev"

function Esperar-Http {
    param([string]$Nombre, [string]$Url, [int]$Intentos = 30, [int]$PausaSeg = 10)
    for ($i = 1; $i -le $Intentos; $i++) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
            if ($r.StatusCode -eq 200) { Write-Host "  [OK] $Nombre" -ForegroundColor Green; return $true }
        } catch {}
        if ($i -eq 1) { Write-Host "  [..] $Nombre (esperando...)" -ForegroundColor Yellow }
        Start-Sleep $PausaSeg
    }
    Write-Host "  [X]  $Nombre NO respondio ($Url)" -ForegroundColor Red
    return $false
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   BIBLIOTECA DIGITAL HENM - Iniciando sistema" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------------------------------------------
# 1. Docker Desktop
# ----------------------------------------------------------------------------
Write-Host "[1/4] Docker Desktop..." -ForegroundColor Cyan
# OJO: usar $LASTEXITCODE (el $? de un pipeline refleja Out-Null, no docker)
docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Docker no responde; abriendo Docker Desktop..." -ForegroundColor Yellow
    $dd = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
    if (-not (Test-Path $dd)) { Write-Host "  [X] No se encontro Docker Desktop en $dd" -ForegroundColor Red; exit 1 }
    Start-Process $dd
    $limite = (Get-Date).AddMinutes(5)
    do {
        Start-Sleep 5
        docker info 2>$null | Out-Null
    } until ($LASTEXITCODE -eq 0 -or (Get-Date) -gt $limite)
    if ($LASTEXITCODE -ne 0) { Write-Host "  [X] Docker no arranco en 5 minutos" -ForegroundColor Red; exit 1 }
}
Write-Host "  [OK] Docker activo" -ForegroundColor Green

# ----------------------------------------------------------------------------
# 2. Contenedores
# ----------------------------------------------------------------------------
Write-Host "[2/4] Contenedores del sistema..." -ForegroundColor Cyan
Set-Location $proyecto
docker compose up -d 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [X] docker compose fallo; reintentando con salida visible..." -ForegroundColor Red
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { exit 1 }
}
Write-Host "  [OK] docker compose up ejecutado" -ForegroundColor Green

# ----------------------------------------------------------------------------
# 3. ngrok (tunel publico con dominio fijo)
# ----------------------------------------------------------------------------
Write-Host "[3/4] Tunel publico (ngrok)..." -ForegroundColor Cyan
$ngrokCorriendo = $false
try {
    $t = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 5
    if ($t.tunnels | Where-Object { $_.public_url -like "*$dominio*" }) { $ngrokCorriendo = $true }
} catch {}

if ($ngrokCorriendo) {
    Write-Host "  [OK] ngrok ya estaba activo" -ForegroundColor Green
} else {
    # Resolver el ejecutable (PATH primero, luego instalacion de winget)
    $ngrok = (Get-Command ngrok -ErrorAction SilentlyContinue).Source
    if (-not $ngrok) {
        $ngrok = (Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter "ngrok.exe" -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
    }
    if (-not $ngrok) {
        Write-Host "  [X] No se encontro ngrok. Instalar con: winget install ngrok.ngrok" -ForegroundColor Red
    } else {
        Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Process -FilePath $ngrok -ArgumentList "http", "--url=$dominio", "8088" -WindowStyle Hidden
        Start-Sleep 6
        Write-Host "  [OK] ngrok iniciado -> https://$dominio" -ForegroundColor Green
    }
}

# ----------------------------------------------------------------------------
# 4. Verificacion de servicios (DSpace tarda 2-3 min en su primer arranque)
# ----------------------------------------------------------------------------
Write-Host "[4/4] Verificando servicios..." -ForegroundColor Cyan
Esperar-Http "Panel de administracion" "http://localhost:8088"            6 5  | Out-Null
Esperar-Http "Auth service (API)"      "http://localhost:3000/health"     6 5  | Out-Null
Esperar-Http "Koha OPAC"               "http://localhost:8082"           12 10 | Out-Null
Esperar-Http "Koha Staff"              "http://localhost:8101"            6 10 | Out-Null
Esperar-Http "DSpace API"              "http://localhost:8090/server/api" 20 15 | Out-Null
Esperar-Http "DSpace UI"               "http://localhost:4000/dspace/"    6 10 | Out-Null

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   SISTEMA LISTO" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  URL publica (compartir):  https://$dominio" -ForegroundColor White
Write-Host ""
Write-Host "  Acceso local:"
Write-Host "    Panel / SSO / Citas:    http://localhost:8088"
Write-Host "    Koha OPAC (catalogo):   http://localhost:8082"
Write-Host "    Koha Staff:             http://localhost:8101"
Write-Host "    DSpace (repositorio):   https://$dominio/dspace/"
Write-Host ""
Write-Host "  Nota: la primera visita a la URL publica muestra el aviso de" -ForegroundColor Yellow
Write-Host "  ngrok (plan gratuito); se pasa con el boton 'Visit Site'." -ForegroundColor Yellow
Write-Host ""
