#!/bin/bash
# Entrypoint del Koha dockerizado (paquetes koha-common oficiales).
# Crea la instancia sobre la base MariaDB del compose usando las credenciales
# ya provisionadas por el contenedor koha-db (usuario/base del .env).
set -e

DB_HOST=${DB_HOST:-koha-db}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-koha_biblioteca}
DB_USER=${DB_USER:-koha}
DB_PASS=${DB_PASS:?Falta DB_PASS}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:?Falta MYSQL_ROOT_PASSWORD}
KOHA_INSTANCE=${KOHA_INSTANCE:-biblioteca}
MEMCACHED_SERVERS=${MEMCACHED_SERVERS:-koha-memcached:11211}

echo "== Koha dockerizado: instancia '$KOHA_INSTANCE' sobre $DB_USER@$DB_HOST/$DB_NAME =="

# El usuario de sistema de la instancia vive en /etc/passwd, que NO persiste
# entre recreaciones del contenedor (los volúmenes solo cubren /etc/koha y
# /var/lib/koha). Recrearlo siempre con uid/gid fijos (1000) para que
# coincida con la propiedad de los archivos en los volúmenes.
KOHA_USER="$KOHA_INSTANCE-koha"
getent group "$KOHA_USER" >/dev/null || groupadd -g 1000 "$KOHA_USER"
getent passwd "$KOHA_USER" >/dev/null || useradd -u 1000 -g 1000 -M \
    -d "/var/lib/koha/$KOHA_INSTANCE" -s /bin/false "$KOHA_USER"

echo "Esperando a MariaDB..."
until mysql -h "$DB_HOST" -P "$DB_PORT" -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; do
    sleep 3
done
echo "MariaDB disponible."

# Credenciales root para que koha-create pueda otorgar permisos
cat > /etc/mysql/koha-common.cnf << EOF
[client]
host     = $DB_HOST
port     = $DB_PORT
user     = root
password = $MYSQL_ROOT_PASSWORD
EOF

if [ ! -f "/etc/koha/sites/$KOHA_INSTANCE/koha-conf.xml" ]; then
    echo "Creando instancia nueva..."

    # Parámetros de la instancia (puertos internos: OPAC 8080, Staff 8081)
    cat > /etc/koha/koha-sites.conf << EOF
DOMAIN=""
INTRAPORT="8081"
INTRAPREFIX=""
INTRASUFFIX="-intra"
OPACPORT="8080"
OPACPREFIX=""
OPACSUFFIX=""
ZEBRA_MARC_FORMAT="marc21"
ZEBRA_LANGUAGE="es"
BIBLIOS_INDEXING_MODE="dom"
AUTHORITIES_INDEXING_MODE="dom"
USE_MEMCACHED="yes"
MEMCACHED_SERVERS="$MEMCACHED_SERVERS"
MEMCACHED_PREFIX="koha_"
ENABLE_SRU="no"
EOF

    # Usar la base y usuario ya creados por el contenedor koha-db
    echo "$KOHA_INSTANCE:$DB_USER:$DB_PASS:$DB_NAME:$DB_HOST" > /etc/koha/passwd

    # Asegurar grants correctos para el usuario koha desde cualquier host
    mysql -h "$DB_HOST" -P "$DB_PORT" -u root -p"$MYSQL_ROOT_PASSWORD" << SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;
SQL

    # koha-create exige mpm_itk aunque no lo usemos: habilitarlo solo
    # durante la creación y volver a deshabilitarlo (no funciona en
    # contenedores; Apache corre como el usuario de la instancia)
    a2enmod mpm_itk >/dev/null 2>&1 || true
    koha-create --use-db "$KOHA_INSTANCE"
    a2dismod mpm_itk >/dev/null 2>&1 || true
    # El vhost que genera koha-create trae AssignUserID (de mpm_itk);
    # se elimina para que el bloque de regeneración lo cree limpio
    rm -f "/etc/apache2/sites-available/$KOHA_INSTANCE.conf"
    echo "Instancia creada."
else
    echo "Instancia existente detectada; reutilizando configuración."
fi

# El vhost de Apache vive en /etc/apache2 (NO persiste entre recreaciones);
# regenerarlo desde la plantilla de koha-common si falta, igual que koha-create
SITE_CONF="/etc/apache2/sites-available/$KOHA_INSTANCE.conf"
if [ ! -f "$SITE_CONF" ]; then
    echo "Regenerando vhost de Apache para $KOHA_INSTANCE..."
    # AssignUserID es de mpm-itk (deshabilitado en contenedor); se elimina
    sed -e "s/__KOHASITE__/$KOHA_INSTANCE/g" \
        -e "s/__OPACPORT__/8080/g" \
        -e "s/__INTRAPORT__/8081/g" \
        -e "s/__OPACSERVER__/localhost/g" \
        -e "s/__INTRASERVER__/localhost/g" \
        -e "s/__UNIXUSER__/$KOHA_USER/g" \
        -e "s/__UNIXGROUP__/$KOHA_USER/g" \
        -e '/AssignUserID/d' \
        /etc/koha/apache-site.conf.in > "$SITE_CONF"
fi

# Sin mpm-itk, todo Apache corre como el usuario de la instancia para que
# CGI (instalador) y archivos de log tengan los mismos permisos que Plack
sed -i "s/^export APACHE_RUN_USER=.*/export APACHE_RUN_USER=$KOHA_USER/" /etc/apache2/envvars
sed -i "s/^export APACHE_RUN_GROUP=.*/export APACHE_RUN_GROUP=$KOHA_USER/" /etc/apache2/envvars
echo "ServerName localhost" > /etc/apache2/conf-available/servername.conf
a2enconf servername >/dev/null 2>&1 || true

# Apache: deshabilitar sitio default, habilitar el de la instancia
a2dissite 000-default >/dev/null 2>&1 || true
a2ensite "$KOHA_INSTANCE" >/dev/null 2>&1 || true

# Directorios de runtime (viven en /var/run y /var/lock, que no persisten
# entre recreaciones del contenedor)
mkdir -p "/var/run/koha/$KOHA_INSTANCE" \
         "/var/lock/koha/$KOHA_INSTANCE/biblios" \
         "/var/lock/koha/$KOHA_INSTANCE/authorities" \
         "/var/cache/koha/$KOHA_INSTANCE"
chown -R "$KOHA_USER:$KOHA_USER" "/var/run/koha/$KOHA_INSTANCE" "/var/lock/koha/$KOHA_INSTANCE" "/var/cache/koha/$KOHA_INSTANCE"

# Servicios de la instancia
koha-zebra --start "$KOHA_INSTANCE" || echo "AVISO: Zebra no pudo iniciar"
koha-plack --enable "$KOHA_INSTANCE" >/dev/null 2>&1 || true
koha-plack --start "$KOHA_INSTANCE" || echo "AVISO: Plack no pudo iniciar"

echo "== Koha listo: OPAC :8080 | Staff :8081 =="

# koha-create/init pueden dejar un Apache corriendo en background;
# detenerlo para relanzarlo como proceso principal del contenedor
service apache2 stop >/dev/null 2>&1 || true
apache2ctl stop >/dev/null 2>&1 || true
sleep 2
rm -f /var/run/apache2/apache2.pid

exec apache2ctl -D FOREGROUND
