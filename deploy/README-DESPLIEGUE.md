# Despliegue en AWS Lightsail — Biblioteca Digital HENM

Servidor: Lightsail 8GB (us-west-2, Oregon) — IP estática **35.85.97.54**

## Arquitectura

Un solo servidor con todo el stack en Docker, Caddy al frente con HTTPS
automático (Let's Encrypt) y un subdominio por servicio:

| Subdominio | Servicio |
|---|---|
| `biblioteca.DOMINIO` | Panel SSO + gestor de citas |
| `catalogo.DOMINIO` | Koha OPAC |
| `staff.DOMINIO` | Koha administración |
| `repositorio.DOMINIO` | DSpace |

Solo los puertos 80/443 quedan expuestos; bases de datos solo en la red
interna de Docker.

## Registros DNS (crear en el registrador del dominio)

Cuatro registros tipo **A**, todos → `35.85.97.54`:

```
biblioteca   A   35.85.97.54
catalogo     A   35.85.97.54
staff        A   35.85.97.54
repositorio  A   35.85.97.54
```

## Runbook

```powershell
# 1. LOCAL: exportar datos actuales (stack local encendido)
powershell -ExecutionPolicy Bypass -File .\deploy\exportar-datos.ps1

# 2. LOCAL: preparar secretos
#    copiar deploy\.env.prod.example -> deploy\.env.prod y completar DOMAIN,
#    ACME_EMAIL y un SESSION_SECRET nuevo (openssl rand -hex 32)

# 3. LOCAL: copiar el proyecto al servidor (con la llave .pem de Lightsail)
scp -i LLAVE.pem -r . ubuntu@35.85.97.54:/opt/biblioteca
#    (o rsync para reintentos; excluir node_modules si se desea)
```

```bash
# 4. SERVIDOR: instalar Docker, swap y levantar el stack
bash /opt/biblioteca/deploy/instalar-servidor.sh

# 5. SERVIDOR: migraciones de DSpace la primera vez
sudo docker exec dspace /dspace/bin/dspace database migrate
sudo docker restart dspace

# 6. SERVIDOR: importar los datos migrados
bash /opt/biblioteca/deploy/importar-datos.sh
```

Verificación: las cuatro URLs con candado (HTTPS), login del panel,
auto-login a Koha/DSpace, búsqueda en catálogo, flujo de citas.

## Respaldos

Lightsail → instancia → Snapshots → habilitar **automatic snapshots**
(diarios, 7 retenidos). Cubre todo el disco (volúmenes Docker incluidos).

## Notas

- El auto-login del panel detecta el esquema por hostname: `localhost`
  (puertos directos), `biblioteca.*` (subdominios de producción con lectura
  del token CSRF vía CORS de Caddy), otro (proxy /koha/ estilo ngrok).
- Costo: ~$44 USD/mes cubierto por créditos AWS (~4.5 meses); vigilar en
  Billing → Credits.
