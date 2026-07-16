#!/bin/bash
# ============================================================================
# Preparar el servidor Ubuntu (AWS Lightsail) para la Biblioteca Digital.
# Se ejecuta UNA vez en el servidor, como usuario ubuntu:
#   bash /opt/biblioteca/deploy/instalar-servidor.sh
# Asume que el proyecto ya fue copiado a /opt/biblioteca (via scp/rsync).
# ============================================================================
set -e

echo "== [1/4] Docker =="
if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker ubuntu
    echo "Docker instalado."
else
    echo "Docker ya estaba instalado."
fi

echo "== [2/4] Swap de seguridad (2 GB) =="
if ! swapon --show | grep -q swapfile; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap activado."
else
    echo "Swap ya existía."
fi

echo "== [3/4] Verificaciones =="
if [ ! -f /opt/biblioteca/deploy/.env.prod ]; then
    echo "FALTA /opt/biblioteca/deploy/.env.prod (copiar desde .env.prod.example y completar)"
    exit 1
fi

echo "== [4/4] Levantar el stack =="
cd /opt/biblioteca
sudo docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build

echo ""
echo "Listo. Contenedores:"
sudo docker ps --format 'table {{.Names}}\t{{.Status}}'
echo ""
echo "Siguiente paso: bash /opt/biblioteca/deploy/importar-datos.sh"
