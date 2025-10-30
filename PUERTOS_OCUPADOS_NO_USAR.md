# 🚫 Puertos Ocupados - NO USAR en Otros Proyectos

**Proyecto:** Sistema Biblioteca Digital HENM
**Fecha:** 29 de Octubre 2025
**Propósito:** Lista rápida de puertos reservados

---

## ❌ PUERTOS OCUPADOS (NO USAR)

```
80       Koha Staff (Apache)
3000     Auth Service API
3307     Koha MariaDB
4000     DSpace Frontend
4040     ngrok Dashboard
5433     PostgreSQL (DSpace)
8000     DSpace Debug
8080     Koha OPAC (Apache)
8081     Koha Web Panel
8088     Admin Panel SSO
8089     Koha API Proxy
8090     DSpace Backend API
8983     Solr (búsqueda)
9000     Proxy ngrok (CRÍTICO)
11212    Memcached
```

**Total: 15 puertos ocupados**

---

## ✅ PUERTOS DISPONIBLES PARA TUS PROYECTOS

### Aplicaciones Web
```
3001, 3002, 3003, 3004, 3005, 3006
8091, 8092, 8093, 8094, 8095, 8096, 8097, 8098, 8099
8100-8200 (100 puertos)
```

### APIs y Backends
```
3010-3020
5000-5050
6000-6100
7000-7100
```

### Bases de Datos
```
3308-3320    (MySQL/MariaDB)
5434-5450    (PostgreSQL)
27017-27020  (MongoDB)
6379-6389    (Redis)
```

### Proxies y Gateways
```
9001-9099
10000-10100
```

### Desarrollo y Testing
```
3030-3050
4100-4200
8300-8500
```

---

## 📝 EJEMPLOS RÁPIDOS

### Proyecto Node.js + PostgreSQL
```yaml
# docker-compose.yml
services:
  app:
    ports:
      - "3001:3000"    # ✅ Puerto libre

  db:
    ports:
      - "5434:5432"    # ✅ Puerto libre (evita 5433)
```

### Proyecto Laravel + MySQL
```yaml
services:
  app:
    ports:
      - "8091:80"      # ✅ Puerto libre

  mysql:
    ports:
      - "3308:3306"    # ✅ Puerto libre (evita 3307)
```

### Proyecto React + Express
```yaml
services:
  frontend:
    ports:
      - "3002:3000"    # ✅ Puerto libre

  backend:
    ports:
      - "3001:3000"    # ✅ Puerto libre
```

### Proyecto Python/Django
```yaml
services:
  web:
    ports:
      - "8100:8000"    # ✅ Puerto libre

  postgres:
    ports:
      - "5434:5432"    # ✅ Puerto libre
```

---

## 🎯 REGLA SIMPLE

**Antes de usar un puerto, verificar que NO esté en esta lista:**

```bash
# Ver si el puerto está libre
sudo lsof -i :PUERTO

# Si no retorna nada = puerto libre ✅
# Si retorna algo = puerto ocupado ❌
```

---

## 💡 RECOMENDACIONES

### Para evitar conflictos siempre:

1. **Apps Web**: Usa el rango **8100-8200**
2. **APIs Node.js**: Usa el rango **3001-3006**
3. **Bases de Datos**: Suma 1 al puerto estándar
   - PostgreSQL: Usa **5434** en vez de 5432
   - MySQL: Usa **3308** en vez de 3306
   - MongoDB: Usa **27018** en vez de 27017
4. **Proxies**: Usa el rango **9001-9099**

---

## 📋 CHECKLIST ANTES DE INICIAR PROYECTO

- [ ] Revisar PUERTOS_OCUPADOS_NO_USAR.md
- [ ] Elegir puertos del rango disponible
- [ ] Verificar con `sudo lsof -i :PUERTO`
- [ ] Documentar puertos elegidos en README del proyecto
- [ ] Usar puertos > 1024 (no requieren root)

---

## 🚀 COMANDOS ÚTILES

```bash
# Ver todos los puertos en uso
sudo netstat -tlnp | grep LISTEN

# Ver puertos Docker
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Verificar puerto específico
sudo lsof -i :8100

# Matar proceso en puerto
sudo lsof -i :8100 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

---

## 📊 RESUMEN VISUAL

```
OCUPADO          LIBRE           LIBRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
80               81-79
3000             3001-3006       3010-3050
3307             3308-3320
4000             4001-4039       4100-4200
4040             4041-4099
5433             5434-5450
8000             8001-8079
8080             8082-8087
8081
8088             8091-8099       8100-8200
8089
8090
8983             8984-8999
9000             9001-9099
11212            11213-11300
```

---

**Versión:** 1.0
**Última Actualización:** 29 de Octubre 2025

---

## 🎯 MENSAJE PARA FUTUROS PROYECTOS

Cuando inicies un nuevo proyecto conmigo, solo dime:

**"Voy a usar los puertos XXX y YYY"**

Y yo verificaré que no estén en esta lista. Simple! 😊
