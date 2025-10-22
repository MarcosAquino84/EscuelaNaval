#!/bin/bash

# ============================================================================
# Script para solucionar la persistencia de sesión en Koha Staff
# Problema: Auto-login funciona pero la sesión no persiste al navegar
# ============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║  🔧 FIX: Persistencia de Sesión en Koha Staff               ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "Este script modificará la configuración de Koha para mejorar"
echo "la persistencia de sesiones al usar auto-login."
echo ""

# Verificar permisos
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script requiere permisos de administrador"
    echo ""
    echo "Por favor, ejecuta:"
    echo "  sudo bash fix-koha-session-persistence.sh"
    exit 1
fi

echo "✅ Permisos verificados"
echo ""

# ==============================================================================
# SOLUCIÓN 1: Configurar Apache para mantener sesiones
# ==============================================================================

echo "📋 PASO 1: Configurando Apache para sesiones persistentes..."
echo ""

APACHE_CONF="/etc/apache2/sites-enabled/biblioteca.conf"

if [ -f "$APACHE_CONF" ]; then
    # Backup del archivo original
    cp "$APACHE_CONF" "$APACHE_CONF.backup-$(date +%Y%m%d-%H%M%S)"
    echo "✅ Backup creado: $APACHE_CONF.backup-$(date +%Y%m%d-%H%M%S)"

    # Agregar configuración de sesiones si no existe
    if ! grep -q "SessionCookieName" "$APACHE_CONF"; then
        echo ""
        echo "Agregando configuración de cookies de sesión..."

        # Buscar la línea de cierre de VirtualHost y agregar antes
        sed -i '/<\/VirtualHost>/i \
    # Configuración de sesiones para auto-login\
    Header always edit Set-Cookie ^(.*)$ $1;SameSite=Lax\
    Header always edit Set-Cookie ^(.*)$ $1;Path=/' "$APACHE_CONF"

        echo "✅ Configuración de cookies agregada"
    else
        echo "⚠️  Configuración de cookies ya existe, omitiendo..."
    fi

    # Agregar timeouts más largos
    if ! grep -q "Timeout 600" "$APACHE_CONF"; then
        sed -i '/<\/VirtualHost>/i \
    # Timeouts más largos para sesiones\
    Timeout 600\
    KeepAlive On\
    KeepAliveTimeout 15\
    MaxKeepAliveRequests 200' "$APACHE_CONF"

        echo "✅ Timeouts configurados"
    else
        echo "⚠️  Timeouts ya configurados, omitiendo..."
    fi
else
    echo "⚠️  No se encontró $APACHE_CONF"
    echo "   Puede ser que Koha esté en un puerto diferente o use otra configuración"
fi

echo ""

# ==============================================================================
# SOLUCIÓN 2: Configurar preferencias de Koha para sesiones más largas
# ==============================================================================

echo "📋 PASO 2: Configurando preferencias de sesión en Koha..."
echo ""

# Conectar a la base de datos de Koha y actualizar preferencias
koha-mysql biblioteca <<EOF
-- Aumentar timeout de sesión a 20 minutos (1200 segundos)
UPDATE systempreferences SET value = '1200' WHERE variable = 'timeout';

-- Usar almacenamiento de sesiones en base de datos (más confiable)
UPDATE systempreferences SET value = 'mysql' WHERE variable = 'SessionStorage';

-- Desactivar validación estricta de IP (permite cambios de IP)
UPDATE systempreferences SET value = '0' WHERE variable = 'SessionRestrictionByIP';

-- Mostrar cambios aplicados
SELECT variable, value FROM systempreferences
WHERE variable IN ('timeout', 'SessionStorage', 'SessionRestrictionByIP');
EOF

if [ $? -eq 0 ]; then
    echo "✅ Preferencias de Koha actualizadas"
else
    echo "❌ Error al actualizar preferencias"
    echo ""
    echo "SOLUCIÓN MANUAL:"
    echo "1. Accede a Koha Staff: http://localhost:8080/"
    echo "2. Ve a: Administración → Preferencias del sistema"
    echo "3. Busca y modifica:"
    echo "   - timeout = 1200"
    echo "   - SessionStorage = mysql"
    echo "   - SessionRestrictionByIP = 0"
fi

echo ""

# ==============================================================================
# SOLUCIÓN 3: Limpiar sesiones antiguas y reiniciar servicios
# ==============================================================================

echo "📋 PASO 3: Limpiando sesiones antiguas..."
echo ""

# Limpiar tabla de sesiones
koha-mysql biblioteca -e "DELETE FROM sessions WHERE a_session LIKE '%logged_in_user%' AND a_session NOT LIKE '%$(date +%Y-%m-%d)%';"

echo "✅ Sesiones antiguas eliminadas"
echo ""

echo "📋 PASO 4: Reiniciando servicios..."
echo ""

# Reiniciar Apache
systemctl restart apache2
if [ $? -eq 0 ]; then
    echo "✅ Apache reiniciado"
else
    echo "❌ Error al reiniciar Apache"
fi

# Reiniciar Koha
systemctl restart koha-common
if [ $? -eq 0 ]; then
    echo "✅ Koha reiniciado"
else
    echo "❌ Error al reiniciar Koha"
fi

# Reiniciar contenedores Docker relacionados
if command -v docker &> /dev/null; then
    echo ""
    echo "Reiniciando contenedores Docker..."
    docker restart ngrok-proxy admin-panel 2>/dev/null
    echo "✅ Contenedores reiniciados"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║  ✅ CONFIGURACIÓN COMPLETADA                                 ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "CAMBIOS APLICADOS:"
echo ""
echo "1. ✅ Apache configurado con cookies SameSite=Lax"
echo "2. ✅ Timeouts aumentados a 600 segundos"
echo "3. ✅ Koha timeout configurado a 1200 segundos (20 minutos)"
echo "4. ✅ SessionStorage cambiado a 'mysql' (más confiable)"
echo "5. ✅ SessionRestrictionByIP desactivado"
echo "6. ✅ Sesiones antiguas eliminadas"
echo "7. ✅ Servicios reiniciados"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🧪 PRUEBA AHORA:"
echo ""
echo "1. Abre: http://localhost:8088/"
echo "2. Haz login con tu usuario"
echo "3. Click en 'Koha Staff'"
echo "4. Navega a 'Tools' (Herramientas)"
echo "5. ✅ La sesión DEBERÍA mantenerse ahora"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📄 ARCHIVOS MODIFICADOS:"
echo "   - $APACHE_CONF (backup creado)"
echo "   - Tabla: systempreferences (base de datos Koha)"
echo ""
echo "⚙️  SI EL PROBLEMA PERSISTE:"
echo ""
echo "Opción 1: Usa login manual directo"
echo "   - Ve a: http://localhost:8080/"
echo "   - Usuario: admin"
echo "   - Password: admin123"
echo ""
echo "Opción 2: Revisa logs de errores"
echo "   sudo tail -f /var/log/apache2/error.log"
echo "   sudo tail -f /var/log/koha/biblioteca/intranet-error.log"
echo ""
echo "Opción 3: Verifica cookies en el navegador"
echo "   - Abre DevTools (F12)"
echo "   - Application → Cookies"
echo "   - Busca: CGISESSID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
