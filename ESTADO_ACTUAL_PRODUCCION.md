# 📌 Estado del Sistema — Biblioteca Digital HENM

**Última actualización:** 16 de julio de 2026
**En producción y funcionando.** Este documento resume todo lo relevante para operar y continuar.

---

## 1. Qué es

Sistema integrado para la Heroica Escuela Naval Militar con tres plataformas y un
punto único de acceso (SSO):

- **Panel de administración** — login unificado, gestión de usuarios y **gestor de
  citas de orientación** entre alumnos y asesores.
- **Koha** — catálogo bibliotecario (OPAC público + interfaz de personal).
- **DSpace 7** — repositorio digital institucional.

Todo dockerizado. Un solo registro de usuario en el panel = alta automática en
los tres sistemas con la misma credencial.

---

## 2. Dónde vive (DOS entornos)

| | Producción (AWS) | Local (desarrollo) |
|---|---|---|
| Servidor | AWS Lightsail 8GB, Oregon (us-west-2) | Docker Desktop en la laptop Windows |
| IP | `184.34.75.175` (estática) | localhost |
| Proyecto | `/opt/biblioteca` | `C:\Users\marck\OneDrive\Documentos\Proyectos\EscuelaNaval` |
| Acceso SSH | `ssh -i "C:\Users\marck\OneDrive\Documentos\SSH\LightsailDefaultKey-us-west-2.pem" ubuntu@184.34.75.175` | — |

> ⚠️ OneDrive absorbió la carpeta Documentos: la ruta correcta es
> `...\OneDrive\Documentos\...`, NO `...\Documentos\...` (esa ya no existe).

### URLs públicas (producción)

| Servicio | URL |
|---|---|
| Panel / SSO / Citas | https://biblioteca.bibliotecahenm.study |
| Koha OPAC (catálogo) | https://catalogo.bibliotecahenm.study |
| Koha Staff | https://staff.bibliotecahenm.study |
| DSpace (repositorio) | https://repositorio.bibliotecahenm.study |

Dominio en **Porkbun** (`bibliotecahenm.study`), 4 registros A → `184.34.75.175`.
HTTPS automático con **Caddy** (Let's Encrypt). Solo puertos 80/443 abiertos.

---

## 3. Credenciales de acceso

**Administradores** (ven todo, incluido Koha Staff y gestión de usuarios):
- `admin@biblioteca.local` / `admin123`
- `coronel.herrera@henm.edu.mx` / `Coronel123`

**Asesor de alto grado** (orientador, con citas disponibles):
- `almirante.castillo@henm.edu.mx` / `Almirante123!`
  — Asesoría Académica y Desarrollo Profesional Naval, disponible Lun-Vie 9-12 y 14-17.

**Otros usuarios de ejemplo** (todos con grado militar) — ver
[datos-ejemplo/README.md](datos-ejemplo/README.md):
cadetes (`Cadete123`), soldados (`Soldado123`), cabos (`Cabo1234`),
teniente asesor (`Teniente123`), 3 psicólogos orientadores (`orientador123`).

> Secretos de infraestructura (contraseñas de BD, SESSION_SECRET) viven en
> `deploy/.env.prod` (en el servidor y la laptop, **nunca en git**).

---

## 4. Contenido cargado

- **Catálogo Koha:** 35 títulos con ejemplares (temática naval/militar) + 2 DVDs.
- **Usuarios:** los mismos en los 3 sistemas (SSO real).
- **Citas de ejemplo:** en estados pendiente / aceptada / completada / rechazada.
- Todo en **español** y con **diseño institucional** (barra tricolor, headers de
  Gobierno de México y Colegio Naval, paleta guinda/dorado).

---

## 5. Cómo operar

### Levantar / detener el entorno LOCAL (Windows)
```
powershell -ExecutionPolicy Bypass -File .\iniciar-sistema.ps1   # arranca Docker + stack + ngrok
powershell -ExecutionPolicy Bypass -File .\detener-sistema.ps1   # detiene (conserva datos)
```
> Si Docker Desktop no arranca con error "starting services... Inference/Secrets
> Engine": matar procesos Docker, renombrar `%LOCALAPPDATA%\Docker\run` y
> `%LOCALAPPDATA%\docker-secrets-engine`, relanzar. Causa: Inicio Rápido de Windows.

### Operar el SERVIDOR (AWS)
```bash
# Conectarse
ssh -i "<ruta .pem>" ubuntu@184.34.75.175

# Comandos del stack (desde /opt/biblioteca)
sudo docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod ps
sudo docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d
sudo docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod logs -f auth-service
```

### Desplegar un cambio de código al servidor
```bash
# desde la laptop (Git Bash):
scp -i "<.pem>" auth-service/auth-server.js ubuntu@184.34.75.175:/opt/biblioteca/auth-service/auth-server.js
ssh -i "<.pem>" ubuntu@184.34.75.175 'cd /opt/biblioteca && \
  sudo docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build auth-service'
```

El runbook completo de despliegue desde cero está en
[deploy/README-DESPLIEGUE.md](deploy/README-DESPLIEGUE.md).

---

## 6. Cómo funciona el SSO (sincronización automática)

Al crear un usuario en el panel (`POST /api/usuarios`) con sus privilegios, el
**auth-service** lo da de alta automáticamente:
- **DSpace:** vía API REST como admin (maneja la rotación del token CSRF de DSpace 7).
- **Koha:** vía API REST (`RESTBasicAuth=1`), con categoría según rol
  (S=staff, T=orientador, ST=estudiante) y contraseña vía POST /patrons/{id}/password.

Cambiar la contraseña en el panel también se propaga a ambos.

> **Política de contraseñas del panel:** mínimo **12 caracteres** + al menos un
> **carácter especial** (ej. `Almirante123!`). Contraseñas más cortas se rechazan.

El **auto-login** (entrar a Koha/DSpace desde el panel sin re-teclear) funciona
completo en Koha. En DSpace el botón redirige y el usuario inicia sesión con su
misma credencial.

---

## 7. Repositorio y control de versiones

- **GitHub:** `MarcosAquino84/EscuelaNaval`, rama **`security-fixes`**.
- **Todo el trabajo está subido** (último commit relevante: `6df4b1c`).
- No versionado (por diseño): `deploy/.env.prod`, `deploy/backup/`, `*.pem`, `.env`.

---

## 8. Pendientes / próximos pasos

1. **Respaldos automáticos (recomendado, acción del usuario):** Lightsail →
   instancia → Snapshots → habilitar automáticos (diarios). Cubre todo el disco.
2. **Vigilar crédito AWS:** ~$44 USD/mes; los ~$200 de cortesía cubren ~4.5 meses.
   Revisar en AWS → Billing → Credits y decidir antes de que se agoten.
3. **Confirmar limpieza:** que la instancia/IP viejas (la de 512MB y la IP
   `35.85.97.54`) estén borradas para no gastar crédito.
4. **Opcional:** auto-login SSO a DSpace vía OIDC (hoy redirige, no autentica solo).

---

## 9. Notas técnicas útiles (lecciones aprendidas)

- **Koha bajo subdominio propio** (no bajo `/koha/` de un proxy): Koha usa rutas
  absolutas, por eso en producción cada servicio tiene su subdominio.
- **nginx/Caddy detrás de TLS:** propagar el `X-Forwarded-Proto` real (no
  `$scheme`) o las cookies `secure` no se emiten y los enlaces salen en http.
- **Koha en Docker:** mpm-itk no funciona en contenedores (Apache corre como el
  usuario de la instancia); `koha-create` exige mpm-itk solo al crear la instancia.
- **DSpace SSR:** usa `rest.ssrBaseUrl` interno; el dev server rechaza hosts no
  reconocidos (usar imagen `-dist`).
- **Archivos de Windows al servidor:** normalizar BOM/CRLF (los scripts de deploy
  ya lo hacen) o bash/compose fallan.
