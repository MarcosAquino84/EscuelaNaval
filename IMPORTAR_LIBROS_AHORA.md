# 📚 IMPORTAR LIBROS EN KOHA - GUÍA RÁPIDA

## 🎯 SOLUCIÓN AL ERROR 404 EN OPAC

**Problema:** El catálogo de Koha está vacío, por eso aparece "Error 404" al buscar.
**Solución:** Importar los 15 libros de ejemplo que ya están preparados.

---

## ✅ MÉTODO 1: Interfaz Web (RECOMENDADO)

### Paso 1: Acceder a Koha Staff

1. Abre tu navegador
2. Ve a: **http://localhost:8080** o **http://localhost/cgi-bin/koha/mainpage.pl**
3. Haz login con las credenciales de staff de Koha

### Paso 2: Ir a Herramientas de Importación

1. En el menú principal, busca **"Tools"** (Herramientas)
2. Click en **"Stage MARC records for import"** (Preparar registros MARC para importar)

### Paso 3: Subir el Archivo

1. Click en **"Choose file"** (Seleccionar archivo)
2. Selecciona: `/home/marcos/EscuelaNaval/libros-marina-mexico.mrc.xml`
3. Configuración:
   - **Record type:** Bibliographic (Bibliográfico)
   - **Character encoding:** UTF-8
   - **Format:** MARCXML
4. Click en **"Upload file"** (Subir archivo)

### Paso 4: Importar al Catálogo

1. Koha mostrará: **"15 records found"** (15 registros encontrados)
2. Click en **"Import this batch into the catalog"**
3. En las opciones:
   - **Check for matches:** Yes (Buscar duplicados)
   - **Add items:** Yes (Agregar items automáticamente)
4. Click en **"Import"**

### Paso 5: Esperar Indexación

1. La importación tomará 1-2 minutos
2. Zebra reindexará automáticamente (puede tomar 5 minutos más)
3. ¡Listo! Ahora puedes buscar en OPAC

---

## 🔧 MÉTODO 2: Línea de Comandos (Alternativo)

Si tienes permisos sudo, ejecuta:

```bash
# Importar usando bulkmarcimport
sudo koha-shell biblioteca -c "perl /usr/share/koha/bin/migration_tools/bulkmarcimport.pl \
  -b -file /home/marcos/EscuelaNaval/libros-marina-mexico.mrc.xml \
  -biblios -commit 100"

# Reconstruir índice Zebra
sudo koha-rebuild-zebra -f -v biblioteca
```

O si prefieres Docker:

```bash
cd /home/marcos/EscuelaNaval
bash cargar-libros-koha.sh
```

---

## 🔍 VERIFICAR QUE FUNCIONÓ

### En OPAC (Catálogo Público)

1. Abre: **http://localhost/** o **http://localhost:8080**
2. En el cuadro de búsqueda, escribe: **"Marina"**
3. Deberías ver los 15 libros listados

### Búsquedas de Prueba

- `Marina` - Todos los materiales
- `Naval` - Temas navales
- `Armada` - Armada de México
- `Documental` - Solo DVDs
- `NAV001` - Búsqueda por código de barras

---

## 📋 LIBROS QUE SE IMPORTARÁN

### Libros (10)
1. Historia Marítima de México
2. Fundamentos de Navegación Astronómica
3. Derecho del Mar y Soberanía Nacional
4. Estrategia Naval y Defensa de Costas
5. Oceanografía Física del Golfo de México
6. Construcción y Mantenimiento de Buques
7. La Armada de México en el Siglo XXI
8. Tácticas de Operaciones Anfibias
9. Meteorología Marina Aplicada
10. Operaciones de Búsqueda y Rescate (SAR)

### Documentales - DVD (5)
1. Armada de México: 200 Años de Historia Naval
2. Guardianes del Mar: Operaciones SAR
3. Poder Naval: Los Buques de la Armada
4. Infantería de Marina: Élite Anfibia
5. Océanos de México: Protección Marina

---

## ⚠️ SOLUCIÓN DE PROBLEMAS

### Si la importación falla:

1. **Verifica que el archivo existe:**
   ```bash
   ls -lh /home/marcos/EscuelaNaval/libros-marina-mexico.mrc.xml
   ```

2. **Verifica permisos:**
   ```bash
   chmod 644 /home/marcos/EscuelaNaval/libros-marina-mexico.mrc.xml
   ```

3. **Revisa logs de Koha:**
   ```bash
   sudo tail -50 /var/log/koha/biblioteca/intranet-error.log
   ```

### Si después de importar NO aparecen en búsquedas:

Es normal que tarde unos minutos. Fuerza la reindexación:

```bash
sudo koha-rebuild-zebra -f -v biblioteca
```

---

## 🌐 URLs DE ACCESO

- **OPAC Local:** http://localhost/ o http://localhost:8080
- **Staff Interface:** http://localhost:8080/cgi-bin/koha/mainpage.pl
- **A través de ngrok:** https://bolshevistically-prototypal-dorris.ngrok-free.dev/koha/

---

## ✅ DESPUÉS DE IMPORTAR

Una vez importados los libros:

1. ✅ El error 404 desaparecerá
2. ✅ Podrás buscar y ver los libros
3. ✅ Los estudiantes podrán hacer préstamos
4. ✅ El catálogo estará completamente funcional

**¡Listo para usar!** 🎉
