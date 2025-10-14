# 🌐 SISTEMA BIBLIOTECA DIGITAL - ACCESO NGROK

**Estado:** ✅ COMPLETAMENTE FUNCIONAL
**Fecha:** 14 de Octubre 2025
**URL Ngrok:** https://bolshevistically-prototypal-dorris.ngrok-free.dev

---

## 📋 URLS DE ACCESO

### 🏠 Panel de Administración (SSO)
**URL:** https://bolshevistically-prototypal-dorris.ngrok-free.dev/

**Funcionalidad:**
- Login unificado para todos los servicios
- Gestión de citas
- Dashboard con acceso a DSpace y Koha

**Credenciales de prueba:**
- Email: `usuario@biblioteca.local`
- Password: (tu contraseña configurada)

---

### 📚 DSpace (Repositorio Digital)
**URL:** https://bolshevistically-prototypal-dorris.ngrok-free.dev/dspace/

**Estado:** ✅ Funcionando correctamente

**Características:**
- Repositorio institucional digital
- Búsqueda de documentos
- Navegación por colecciones
- Interfaz en español

**Configuración Aplicada:**
- URLs relativas usando hostname de ngrok
- CORS configurado para ngrok
- Headers HTTPS correctos en proxy

---

### 📖 Koha OPAC (Catálogo Público)
**URL:** https://bolshevistically-prototypal-dorris.ngrok-free.dev/koha/

**Estado:** ✅ Funcionando correctamente

**Funcionalidad:**
- Búsqueda de libros en el catálogo
- Consulta de disponibilidad
- Acceso público sin autenticación

---

### 🔧 Koha Staff (Administración Bibliotecaria)
**URL:** https://bolshevistically-prototypal-dorris.ngrok-free.dev/koha-staff/

**Estado:** ✅ Funcionando correctamente

**Funcionalidad:**
- Gestión de catalogación
- Administración de préstamos
- Gestión de usuarios
- Configuración del sistema

**Credenciales:**
- Usuario: `admin` (o tu usuario de Koha)
- Password: (tu contraseña de Koha)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
Internet
    ↓
ngrok (con --host-header=rewrite)
    ↓
http://localhost:9000 (nginx-proxy-unified)
    ├── / → Admin Panel (puerto 8088)
    ├── /dspace/ → DSpace Angular (puerto 4000)
    ├── /server/ → DSpace REST API (puerto 8090)
    ├── /koha/ → Koha OPAC Apache (puerto 8080)
    ├── /koha-staff/ → Koha Staff Apache (puerto 80)
    └── /api/ → Auth Service (puerto 3000)
```

---

## 🐳 CONTENEDORES DOCKER

### Contenedores Activos:

1. **dspace** - Backend REST API de DSpace
   - Puerto: 8090:8080
   - Base de datos: dspacedb
   - Solr: dspacesolr

2. **dspace-angular** - Frontend de DSpace
   - Puerto: 4000:4000
   - Configuración: URLs con hostname de ngrok

3. **dspacedb** - PostgreSQL para DSpace
   - Puerto: 5433:5432

4. **dspacesolr** - Motor de búsqueda Solr
   - Puerto: 8983:8983

5. **auth-service** - Servicio de autenticación SSO
   - Puerto: 3000:3000
   - Node.js + Express

6. **koha-db** - MariaDB para Koha
   - Puerto: 3307:3306

7. **koha-memcached** - Caché para Koha
   - Puerto: 11212:11211

8. **admin-panel** - Panel de administración
   - Puerto: 8088:80

9. **ngrok-proxy** - Proxy unificado nginx
   - Puerto: 9000:80
   - **Punto de entrada principal**

---

## ⚙️ CONFIGURACIÓN CLAVE

### DSpace Backend (docker-compose.yml)

```yaml
dspace:
  environment:
    dspace__P__server__P__url: 'https://bolshevistically-prototypal-dorris.ngrok-free.dev/server'
    dspace__P__ui__P__url: 'https://bolshevistically-prototypal-dorris.ngrok-free.dev/dspace'
    rest__P__cors__P__allowed__origins: 'https://bolshevistically-prototypal-dorris.ngrok-free.dev'
    proxies__P__trusted__P__ipranges: '172.23.0, 172.27.0'
```

### DSpace Angular (docker-compose.yml)

```yaml
dspace-angular:
  environment:
    DSPACE_UI_NAMESPACE: '/dspace'
    DSPACE_REST_SSL: 'true'
    DSPACE_REST_HOST: 'bolshevistically-prototypal-dorris.ngrok-free.dev'
    DSPACE_REST_PORT: '443'
    DSPACE_REST_NAMESPACE: '/server'
  command: sh -c "yarn serve --host 0.0.0.0 --disable-host-check"
```

### Nginx Proxy (nginx-proxy-unified.conf)

Headers HTTPS configurados:
```nginx
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Port 443;
proxy_set_header X-Forwarded-Host $host;
```

---

## 🚀 COMANDOS ÚTILES

### Iniciar ngrok
```bash
/home/marcos/ngrok http 9000 --host-header=rewrite
```

### Ver logs de DSpace
```bash
# Backend
docker logs dspace -f

# Frontend
docker logs dspace-angular -f
```

### Reiniciar servicios
```bash
# Reiniciar todo el stack
docker-compose restart

# Reiniciar solo DSpace
docker restart dspace dspace-angular

# Reiniciar proxy
docker restart ngrok-proxy
```

### Verificar estado
```bash
# Ver contenedores activos
docker ps

# Probar servicios localmente
curl http://localhost:9000/dspace/
curl http://localhost:9000/server/api
curl http://localhost:9000/koha/
curl http://localhost:9000/koha-staff/
```

### Detener todo
```bash
# Detener contenedores
docker-compose down

# Detener ngrok
pkill ngrok
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error 500 en DSpace
**Causa:** Config.json con URLs incorrectas o caché del navegador

**Solución:**
1. Limpiar caché del navegador (`Ctrl + Shift + Del`)
2. Abrir en modo incógnito
3. Verificar config.json:
```bash
curl http://localhost:9000/dspace/assets/config.json | grep baseUrl
```

Debe mostrar:
```json
"baseUrl": "https://bolshevistically-prototypal-dorris.ngrok-free.dev/server"
```

### Invalid Host Header
**Causa:** ngrok sin `--host-header=rewrite`

**Solución:**
```bash
pkill ngrok
/home/marcos/ngrok http 9000 --host-header=rewrite
```

### DSpace no compila
**Causa:** Configuración incorrecta en docker-compose.yml

**Solución:**
```bash
docker stop dspace-angular
docker rm dspace-angular
docker-compose up -d dspace-angular
# Esperar 2-3 minutos para compilación
docker logs dspace-angular -f
```

### Koha no responde
**Causa:** Apache no está ejecutándose

**Solución:**
```bash
sudo systemctl status apache2
sudo systemctl start apache2
```

---

## 📊 ESTADO DE SERVICIOS

| Servicio | Puerto Local | URL Ngrok | Estado |
|----------|--------------|-----------|--------|
| Admin Panel | 8088 | `/` | ✅ |
| DSpace Frontend | 4000 | `/dspace/` | ✅ |
| DSpace API | 8090 | `/server/` | ✅ |
| Koha OPAC | 8080 | `/koha/` | ✅ |
| Koha Staff | 80 | `/koha-staff/` | ✅ |
| Auth Service | 3000 | `/api/` | ✅ |
| Nginx Proxy | 9000 | (todos) | ✅ |

---

## 📝 NOTAS IMPORTANTES

1. **Caché del Navegador:** Siempre limpiar caché al actualizar configuración
2. **ngrok URL:** La URL de ngrok es temporal. Si cambia, actualizar `docker-compose.yml`
3. **Primera Carga:** La advertencia de ngrok es normal, hacer clic en "Visit Site"
4. **Compilación:** DSpace Angular tarda 2-3 minutos en compilar tras reiniciar
5. **HTTPS:** ngrok proporciona HTTPS automáticamente, el sistema está configurado para usarlo

---

## 🎯 PRÓXIMOS PASOS

### Para hacer el sistema permanente:

1. **Configurar ngrok con dominio propio:**
   - Obtener plan de ngrok con dominio estático
   - Actualizar URLs en `docker-compose.yml`

2. **Diseño institucional de Koha:**
   - Seguir instrucciones en `PASOS_CONFIGURAR_KOHA.md`
   - Copiar archivos CSS/JS personalizados
   - Configurar preferencias del sistema

3. **Poblar con contenido:**
   - Agregar comunidades y colecciones en DSpace
   - Catalogar libros en Koha
   - Crear usuarios de prueba

4. **Configuración de producción:**
   - Cambiar contraseñas por defecto
   - Configurar backups automáticos
   - Configurar SSL/HTTPS propio
   - Optimizar rendimiento

---

## 📞 SOPORTE

**Documentación adicional:**
- `PASOS_CONFIGURAR_KOHA.md` - Personalización de Koha
- `COMANDOS_INSTALAR_DISENO.txt` - Instalación de diseño institucional
- `docker-compose.yml` - Configuración de contenedores
- `nginx-proxy-unified.conf` - Configuración del proxy

**Verificación rápida:**
```bash
# Verificar todos los servicios
curl -s http://localhost:9000/ | grep -o "<title>.*</title>"
curl -s http://localhost:9000/dspace/ | grep -o "<title>.*</title>"
curl -s http://localhost:9000/server/api | grep dspaceServer
```

---

**Sistema desarrollado para:** Heroica Escuela Naval Militar (HENM)
**Fecha de configuración:** Octubre 2025
**Versiones:**
- DSpace: 7.x
- Koha: Latest (Apache)
- Node.js: Latest (Auth Service)
- PostgreSQL: Latest
- MariaDB: 10.11
