#!/bin/bash
# Script para crear usuarios en Koha desde el sistema de autenticación
# Uso: ./koha-create-user.sh <email> <password> <nombre> <apellido> <is_staff>

if [ "$#" -ne 5 ]; then
    echo "Error: Se requieren 5 parámetros"
    echo "Uso: $0 <email> <password> <nombre> <apellido> <is_staff>"
    exit 1
fi

EMAIL="$1"
PASSWORD="$2"
NOMBRE="$3"
APELLIDO="$4"
IS_STAFF="$5"

# Generar userid (primera letra del nombre + apellido en minúsculas)
USERID=$(echo "${NOMBRE:0:1}${APELLIDO}" | tr '[:upper:]' '[:lower:]' | tr -d ' ')

# Generar cardnumber único
CARDNUMBER="USR$(date +%s | tail -c 9)"

# Determinar categorycode
if [ "$IS_STAFF" == "true" ]; then
    CATEGORYCODE="ST"  # Staff
else
    CATEGORYCODE="PT"  # Patron
fi

# Crear usuario en Koha usando SQL directo
sudo mysql koha_biblioteca -e "
INSERT INTO borrowers (
    cardnumber,
    surname,
    firstname,
    email,
    userid,
    password,
    categorycode,
    branchcode,
    dateenrolled,
    dateexpiry
) VALUES (
    '$CARDNUMBER',
    '$APELLIDO',
    '$NOMBRE',
    '$EMAIL',
    '$USERID',
    PASSWORD('$PASSWORD'),
    '$CATEGORYCODE',
    'CPL',
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
);" 2>&1

if [ $? -eq 0 ]; then
    # Obtener borrowernumber
    BORROWERNUMBER=$(sudo mysql koha_biblioteca -sN -e "SELECT borrowernumber FROM borrowers WHERE email='$EMAIL' LIMIT 1;")
    echo "{\"success\":true,\"borrowernumber\":$BORROWERNUMBER,\"userid\":\"$USERID\",\"cardnumber\":\"$CARDNUMBER\"}"
    exit 0
else
    echo "{\"success\":false,\"error\":\"Failed to create user in Koha\"}"
    exit 1
fi
