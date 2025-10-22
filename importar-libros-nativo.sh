#!/bin/bash

# ============================================================================
# Script para importar libros en Koha NATIVO (Ubuntu)
# Biblioteca Digital HENM
# ============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║  📚 IMPORTANDO LIBROS EN KOHA NATIVO                        ║"
echo "║  15 Registros MARC - Temática Marina de México               ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

ARCHIVO="/home/marcos/EscuelaNaval/libros-marina-mexico.mrc.xml"

# Verificar que el archivo existe
if [ ! -f "$ARCHIVO" ]; then
    echo "❌ Error: Archivo $ARCHIVO no encontrado"
    exit 1
fi

echo "✅ Archivo MARC encontrado: $ARCHIVO"
echo ""

# Intentar importar
echo "📥 Importando registros MARC..."
echo ""

sudo koha-shell biblioteca -c "perl /usr/share/koha/bin/migration_tools/bulkmarcimport.pl \
  -b \
  -file $ARCHIVO \
  -biblios \
  -commit 100 \
  -v" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Importación completada"
    echo ""

    # Reconstruir índice Zebra
    echo "🔄 Reconstruyendo índice de búsqueda (Zebra)..."
    sudo koha-rebuild-zebra -f -v biblioteca

    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║  ✅ PROCESO COMPLETADO EXITOSAMENTE                         ║"
    echo "║                                                              ║"
    echo "║  Los libros ya están disponibles en:                         ║"
    echo "║  • OPAC: http://localhost/                                   ║"
    echo "║  • Staff: http://localhost:8080/                             ║"
    echo "║                                                              ║"
    echo "║  Busca \"Marina\" o \"Naval\" para ver los libros             ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
else
    echo ""
    echo "❌ Error durante la importación"
    echo ""
    echo "Por favor, usa el método web:"
    echo "1. Abre http://localhost:8080/"
    echo "2. Ve a Tools > Stage MARC records for import"
    echo "3. Sube el archivo: $ARCHIVO"
    echo ""
    echo "Ver guía completa en: IMPORTAR_LIBROS_AHORA.md"
    echo ""
fi
