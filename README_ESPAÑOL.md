# 🇪🇸 Sistema de Biblioteca en Español

## Inicio Rápido

Para iniciar todo el sistema **completamente configurado en español**:

```bash
./iniciar-sistema-espanol.sh
```

Este script automáticamente:
- ✅ Inicia todas las bases de datos
- ✅ Inicia DSpace (repositorio digital)
- ✅ Inicia Koha (sistema bibliotecario)
- ✅ Configura el idioma español en ambos sistemas
- ✅ Muestra las URLs de acceso

---

## 🌐 URLs de Acceso

| Sistema | URL | Credenciales |
|---------|-----|--------------|
| **Panel Principal** | http://localhost:8081 | - |
| **DSpace** | http://localhost:4000 | - |
| **Koha Staff** | http://localhost:8086/cgi-bin/koha/mainpage.pl | admin / admin123 |
| **Koha OPAC** | http://localhost:8085 | - |

---

## ⏱️ Tiempos de Espera

Después de ejecutar el script, espera:

- **PostgreSQL/MariaDB**: 15 segundos
- **DSpace Backend**: 1-2 minutos
- **DSpace Frontend**: 3-5 minutos (primera vez)
- **Koha**: 2-3 minutos (primera vez)

---

## 🔧 Solución Rápida de Problemas

### DSpace sigue en inglés

1. Espera a que termine de compilar (3-5 minutos)
2. Busca el selector de idioma arriba a la derecha
3. Selecciona "Español"
4. Limpia caché: `Ctrl + Shift + Delete`

### Koha sigue en inglés

```bash
./configurar-espanol-koha.sh
```

---

## 📚 Documentación Completa

Para información detallada, consulta:
- **CONFIGURACION_ESPAÑOL.md** - Guía completa de configuración
- **ESTADO_ACTUAL_DSPACE.md** - Estado del sistema

---

## 🛑 Detener el Sistema

```bash
docker-compose down
```

---

## ✅ Todo Configurado

Este sistema ya tiene:
- ✅ Idioma español en DSpace (backend + frontend)
- ✅ Idioma español en Koha (staff + OPAC)
- ✅ Variables de entorno configuradas
- ✅ Zona horaria: America/Argentina/Buenos_Aires
- ✅ Formato de hora: 24h
- ✅ Scripts automatizados de inicio

**¡Solo ejecuta `./iniciar-sistema-espanol.sh` y espera!**
