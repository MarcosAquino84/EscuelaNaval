# Biblioteca Digital - DSpace + Koha

Sistema integrado de biblioteca digital usando Docker, con DSpace para repositorio institucional y Koha para gestión bibliotecaria.

## Componentes

### DSpace 7.6
- **Frontend**: Angular UI en puerto 4000
- **Backend**: REST API en puerto 8080
- **Base de datos**: PostgreSQL 13
- **Búsqueda**: Apache Solr

### Koha (Próximamente)
- Sistema integrado de gestión bibliotecaria

## Requisitos

- Docker y Docker Compose
- 4GB RAM mínimo (8GB recomendado)
- 10GB espacio en disco

## Instalación Rápida

```bash
# Iniciar servicios
./start.sh

# Detener servicios
./stop.sh
```

## Acceso

- **DSpace Frontend**: http://localhost:4000
- **DSpace API**: http://localhost:8080/server
- **Solr Admin**: http://localhost:8983/solr

## Primer Uso

1. Esperar 2-3 minutos después de iniciar
2. Acceder a http://localhost:4000
3. Crear cuenta de administrador en el primer acceso

## Estructura del Proyecto

```
biblioteca/
├── docker-compose.yml      # Configuración de servicios
├── .env                    # Variables de entorno
├── dspace/                 # Datos de DSpace
│   ├── config/            # Configuración
│   ├── data/              # Archivos del repositorio
│   ├── logs/              # Logs del sistema
│   └── solr/              # Índices de búsqueda
├── postgresql/            # Datos de PostgreSQL
├── scripts/               # Scripts de utilidad
├── start.sh              # Script de inicio
└── stop.sh               # Script de parada
```

## Solución de Problemas

### Los servicios no inician
```bash
# Ver logs
docker compose logs -f

# Reiniciar servicios
docker compose restart
```

### Limpiar todo y empezar de nuevo
```bash
docker compose down -v
rm -rf dspace/data/* postgresql/data/*
./start.sh
```

## Próximos Pasos

- [ ] Integración con Koha
- [ ] Configuración de LDAP/Active Directory
- [ ] Backup automatizado
- [ ] Monitoreo con Prometheus/Grafana