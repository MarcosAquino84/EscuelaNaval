#!/bin/bash
# Script para actualizar contraseñas de usuarios en Koha
# Uso: ./koha-update-password.sh <email> <new_password>

if [ "$#" -ne 2 ]; then
    echo "Error: Se requieren 2 parámetros"
    echo "Uso: $0 <email> <new_password>"
    exit 1
fi

EMAIL="$1"
NEW_PASSWORD="$2"

# Actualizar contraseña en Koha
sudo mysql koha_biblioteca -e "
UPDATE borrowers
SET password = PASSWORD('$NEW_PASSWORD')
WHERE email = '$EMAIL';" 2>&1

if [ $? -eq 0 ]; then
    # Verificar que el usuario existe y fue actualizado
    UPDATED=$(sudo mysql koha_biblioteca -sN -e "SELECT COUNT(*) FROM borrowers WHERE email='$EMAIL';")
    if [ "$UPDATED" -gt 0 ]; then
        echo "{\"success\":true,\"email\":\"$EMAIL\"}"
        exit 0
    else
        echo "{\"success\":false,\"error\":\"User not found in Koha\"}"
        exit 1
    fi
else
    echo "{\"success\":false,\"error\":\"Failed to update password in Koha\"}"
    exit 1
fi
