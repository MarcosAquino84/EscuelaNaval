# ============================================================================
# BIBLIOTECA DIGITAL HENM - Detener el sistema completo
# Para: tunel ngrok + todos los contenedores (los datos persisten en volumenes)
# Uso:  powershell -ExecutionPolicy Bypass -File .\detener-sistema.ps1
# ============================================================================

$ErrorActionPreference = 'Continue'

Write-Host ""
Write-Host "Deteniendo Biblioteca Digital HENM..." -ForegroundColor Cyan

# 1. ngrok
$p = Get-Process ngrok -ErrorAction SilentlyContinue
if ($p) {
    $p | Stop-Process -Force
    Write-Host "  [OK] Tunel ngrok detenido" -ForegroundColor Green
} else {
    Write-Host "  [--] ngrok no estaba corriendo"
}

# 2. Contenedores (down sin -v: los volumenes con datos NO se borran)
Set-Location $PSScriptRoot
docker compose down 2>&1 | Out-Null
Write-Host "  [OK] Contenedores detenidos (datos conservados en volumenes)" -ForegroundColor Green

Write-Host ""
Write-Host "Sistema detenido. Para volver a levantarlo: .\iniciar-sistema.ps1" -ForegroundColor Cyan
Write-Host ""
