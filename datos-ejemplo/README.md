# Datos de ejemplo — Biblioteca Digital HENM

Paquete para poblar el sistema con datos de demostración. Todo es idempotente
(se puede volver a correr sin duplicar).

## Contenido

| Archivo | Qué carga | Cómo ejecutar |
|---|---|---|
| `libros-naval-ejemplo.xml` | 20 registros MARC (18 libros + 2 DVD) temática naval/militar, ejemplares NAV016-033 y DVD006-007 | `docker cp datos-ejemplo/libros-naval-ejemplo.xml koha:/tmp/libros-nuevos.xml && docker exec koha bash -c "koha-shell biblioteca -c '/usr/share/koha/bin/migration_tools/bulkmarcimport.pl -b -m MARCXML -file /tmp/libros-nuevos.xml -commit 50' && koha-rebuild-zebra -f biblioteca"` |
| `usuarios-ejemplo.js` | 9 usuarios con grados en el panel (biblioteca_auth) + disponibilidad del teniente | `docker cp datos-ejemplo/usuarios-ejemplo.js auth-service:/tmp/ && docker exec -e NODE_PATH=/app/node_modules auth-service node /tmp/usuarios-ejemplo.js` |
| `koha-usuarios-ejemplo.pl` | Los mismos 9 usuarios en Koha + categorías CAD/TRP/OFC | `docker cp datos-ejemplo/koha-usuarios-ejemplo.pl koha:/tmp/ && docker exec koha bash -c "sed -i 's/\r\$//' /tmp/koha-usuarios-ejemplo.pl && koha-shell biblioteca -c 'perl /tmp/koha-usuarios-ejemplo.pl'"` |
| `citas-ejemplo.sql` | 4 citas en estados pendiente/aceptada/completada/rechazada | `docker exec -i dspacedb psql -U dspace -d biblioteca_auth < datos-ejemplo/citas-ejemplo.sql` |

## Usuarios de ejemplo (mismas credenciales en panel y Koha)

| Grado | Email (login del panel) | Usuario Koha | Contraseña | Rol / categoría |
|---|---|---|---|---|
| Cadete | cadete.perez@henm.edu.mx | cadete.perez | Cadete123 | estudiante / CAD |
| Cadete | cadete.gomez@henm.edu.mx | cadete.gomez | Cadete123 | estudiante / CAD |
| Cadete | cadete.torres@henm.edu.mx | cadete.torres | Cadete123 | estudiante / CAD |
| Soldado | soldado.ramos@henm.edu.mx | soldado.ramos | Soldado123 | estudiante / TRP |
| Soldado | soldado.diaz@henm.edu.mx | soldado.diaz | Soldado123 | estudiante / TRP |
| Cabo | cabo.mendoza@henm.edu.mx | cabo.mendoza | Cabo1234 | estudiante / TRP |
| Cabo | cabo.silva@henm.edu.mx | cabo.silva | Cabo1234 | estudiante / TRP |
| Teniente | teniente.vargas@henm.edu.mx | teniente.vargas | Teniente123 | orientador (Consejería y Desarrollo Militar) / OFC |
| Coronel | coronel.herrera@henm.edu.mx | coronel.herrera | Coronel123 | administrador / OFC (superlibrarian en Koha) |

Los estudiantes ven en el dashboard: DSpace, Koha OPAC, Solicitar cita y Mis
citas. El teniente (orientador) ve Gestionar citas. El coronel ve todo,
incluido Koha Staff y Administrar usuarios.

## Citas de ejemplo

1. cadete.perez → Psic. Ramírez — **pendiente** (20-jul-2026 10:00)
2. cadete.gomez → Tte. Vargas — **aceptada** (17-jul-2026 09:00)
3. soldado.ramos → Psic. Martínez — **completada** (08-jul-2026, con notas)
4. cabo.mendoza → Psic. López — **rechazada** (con motivo de reagendado)
