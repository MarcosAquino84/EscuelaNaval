# Estructura de Branches y Versiones del Proyecto

**Fecha:** 29 de Octubre 2025
**Proyecto:** Sistema SSO Biblioteca Digital HENM

---

## 🌳 Árbol de Branches

```
master (base)
  │
  ├─ security-fixes (desarrollo activo)
  │    │
  │    └─ 23253b3: feat: Resolver persistencia de sesión en auto-login de Koha
  │         ├─ VERSION_FUNCIONAL_KOHA_AUTOLOGIN.md (1,300+ líneas doc)
  │         ├─ koha-staff-auto-login.html (nuevo)
  │         ├─ koha-opac-auto-login.html (actualizado)
  │         ├─ dashboard.html (auto-login habilitado)
  │         └─ nginx-proxy-unified.conf (cookies fix)
  │
  └─ version-funcional-v2.0-koha-autologin (respaldo estable) ✅
       │
       └─ 367c848: docs: Crear branch version-funcional-v2.0-koha-autologin
            ├─ Todo de security-fixes (commit 23253b3)
            └─ README_VERSION_FUNCIONAL_V2.md (guía del branch)
```

---

## 📋 Descripción de Branches

### `master`
**Propósito:** Branch principal del proyecto
**Estado:** Base original
**Usar para:**
- Referencia de código inicial
- Comparar cambios

**NO usar para:**
- Desarrollo
- Producción

---

### `security-fixes`
**Propósito:** Branch de desarrollo activo
**Estado:** Última versión funcional + mejoras continuas
**Usar para:**
- Desarrollo de nuevas features
- Experimentación
- Mejoras incrementales

**Commit clave:**
- `23253b3`: Resolver persistencia de sesión en Koha

**Características:**
- ✅ Auto-login Koha OPAC persistente
- ✅ Auto-login Koha Staff persistente
- ✅ Documentación completa
- ⚠️ Puede tener cambios experimentales

---

### `version-funcional-v2.0-koha-autologin` ⭐ **RECOMENDADO**
**Propósito:** Versión estable de respaldo/producción
**Estado:** ✅ Completamente funcional y probada
**Usar para:**
- **Producción**
- **Demos**
- **Punto de restauración**
- **Base para nuevas features**

**Commits clave:**
- `23253b3`: Resolver persistencia de sesión (base)
- `367c848`: Documentación del branch (último)

**Características:**
- ✅ Auto-login Koha OPAC persistente
- ✅ Auto-login Koha Staff persistente
- ✅ Auto-login DSpace funcional
- ✅ Panel SSO centralizado
- ✅ Compatible con ngrok
- ✅ Documentación exhaustiva (2 archivos principales)
- ✅ Testing validado
- ✅ README específico del branch

**Archivos especiales:**
1. `VERSION_FUNCIONAL_KOHA_AUTOLOGIN.md` - Documentación maestra (1,300+ líneas)
2. `README_VERSION_FUNCIONAL_V2.md` - Guía del branch (500+ líneas)

---

## 🎯 ¿Qué Branch Usar?

### Para Desarrollo de Nuevas Features:
```bash
# Opción 1: Desde el branch estable
git checkout version-funcional-v2.0-koha-autologin
git checkout -b feature/mi-nueva-funcionalidad

# Opción 2: Desde el branch de desarrollo
git checkout security-fixes
git checkout -b feature/mi-nueva-funcionalidad
```

### Para Demos o Producción:
```bash
# SIEMPRE usar el branch estable
git checkout version-funcional-v2.0-koha-autologin
docker-compose up -d
./iniciar-ngrok.sh
```

### Para Experimentar Sin Riesgo:
```bash
# Crear branch temporal desde estable
git checkout version-funcional-v2.0-koha-autologin
git checkout -b experimento-temporal

# Si funciona: merge a security-fixes
# Si no funciona: eliminar branch
```

### Para Restaurar Sistema Funcional:
```bash
# Si algo se rompió en otro branch
git checkout version-funcional-v2.0-koha-autologin

# Verificar que todo funciona
docker-compose restart
curl http://localhost:9000/
```

---

## 🔄 Flujo de Trabajo Recomendado

### 1. Desarrollo de Nueva Feature

```bash
# Partir del branch estable
git checkout version-funcional-v2.0-koha-autologin

# Crear branch de feature
git checkout -b feature/nueva-funcionalidad

# Desarrollar y probar
# ... hacer cambios ...
git add .
git commit -m "feat: descripción"

# Probar exhaustivamente
docker-compose restart
./iniciar-ngrok.sh
# Validar que todo funciona

# Si funciona bien: merge a security-fixes
git checkout security-fixes
git merge feature/nueva-funcionalidad

# Si es muy estable: crear nuevo branch de versión
git checkout -b version-funcional-v2.1
```

### 2. Fixing de Bugs

```bash
# Identificar bug en security-fixes
git checkout security-fixes

# Crear branch de fix
git checkout -b fix/descripcion-bug

# Arreglar y probar
git add .
git commit -m "fix: descripción"

# Merge a security-fixes
git checkout security-fixes
git merge fix/descripcion-bug

# Si afecta versión estable: aplicar fix también ahí
git checkout version-funcional-v2.0-koha-autologin
git cherry-pick <commit-hash>
```

### 3. Crear Nueva Versión Estable

```bash
# Cuando security-fixes tiene mejoras validadas
git checkout security-fixes

# Crear nuevo branch de versión
git checkout -b version-funcional-v2.1-nueva-mejora

# Agregar README
cat > README_VERSION_FUNCIONAL_V2.1.md
# ... documentar cambios ...

git add README_VERSION_FUNCIONAL_V2.1.md
git commit -m "docs: Crear version-funcional-v2.1"
```

---

## 📊 Comparación de Branches

| Característica | master | security-fixes | v2.0-koha-autologin |
|----------------|--------|----------------|---------------------|
| **Auto-login Koha OPAC** | ❌ | ✅ | ✅ |
| **Auto-login Koha Staff** | ❌ | ✅ | ✅ |
| **Persistencia sesión** | ❌ | ✅ | ✅ |
| **Compatible ngrok** | ❌ | ✅ | ✅ |
| **Documentación completa** | ❌ | ✅ | ✅✅ (2 docs) |
| **README del branch** | ❌ | ❌ | ✅ |
| **Testing validado** | ❌ | ⚠️ | ✅ |
| **Estable para producción** | ❌ | ⚠️ | ✅ |
| **Cambios experimentales** | ❌ | Posible | ❌ |
| **Recomendado para** | Referencia | Desarrollo | Producción |

---

## 🔐 Commits Importantes

### Commit: 23253b3 (Base de v2.0)
```
feat: Resolver persistencia de sesión en auto-login de Koha

ARCHIVOS CLAVE:
- VERSION_FUNCIONAL_KOHA_AUTOLOGIN.md (nuevo)
- admin-panel/koha-staff-auto-login.html (nuevo)
- admin-panel/koha-opac-auto-login.html (actualizado)
- admin-panel/dashboard.html (actualizado)
- nginx-proxy-unified.conf (fix crítico)

PROBLEMA RESUELTO:
Sesiones de Koha no persistían después de auto-login

SOLUCIÓN:
1. URLs relativas (no hardcodeadas)
2. Nginx sin reescribir cookies
3. Nuevo archivo para Staff auto-login
```

### Commit: 367c848 (Branch v2.0)
```
docs: Crear branch version-funcional-v2.0-koha-autologin

ARCHIVOS NUEVOS:
- README_VERSION_FUNCIONAL_V2.md

PROPÓSITO:
Branch de respaldo/producción con versión estable
```

---

## 📚 Documentación por Branch

### master
- Documentación original del proyecto

### security-fixes
- `VERSION_FUNCIONAL_KOHA_AUTOLOGIN.md` (1,300+ líneas)
- Documentación de desarrollo
- Commits descriptivos

### version-funcional-v2.0-koha-autologin
- `VERSION_FUNCIONAL_KOHA_AUTOLOGIN.md` (1,300+ líneas) ✅
- `README_VERSION_FUNCIONAL_V2.md` (500+ líneas) ✅
- Guías completas de uso
- Troubleshooting exhaustivo
- Checklist de validación

---

## 🚀 Comandos Rápidos

### Ver todos los branches:
```bash
git branch -a
```

### Ver historial gráfico:
```bash
git log --oneline --graph --all --decorate -15
```

### Cambiar de branch:
```bash
# A branch de desarrollo
git checkout security-fixes

# A branch estable (recomendado)
git checkout version-funcional-v2.0-koha-autologin

# A master
git checkout master
```

### Comparar branches:
```bash
# Ver diferencias entre branches
git diff master..security-fixes

# Ver archivos diferentes
git diff --name-status master..version-funcional-v2.0-koha-autologin
```

### Crear nuevo branch desde estable:
```bash
git checkout version-funcional-v2.0-koha-autologin
git checkout -b mi-nuevo-branch
```

### Merge de branches:
```bash
# Merge feature a security-fixes
git checkout security-fixes
git merge feature/mi-funcionalidad

# Merge security-fixes a estable (CUIDADO)
git checkout version-funcional-v2.0-koha-autologin
git merge security-fixes
# Solo si está bien probado
```

---

## ⚠️ Advertencias Importantes

### 1. NO Hacer Push Force a Branches Estables
```bash
# ❌ NUNCA hacer esto en version-funcional-v2.0-koha-autologin
git push --force

# ✅ Usar push normal
git push
```

### 2. Probar Antes de Merge a Estable
```bash
# Antes de merge a version-funcional-v2.0-koha-autologin
# SIEMPRE probar exhaustivamente:

docker-compose down
docker-compose up -d
sleep 120
./iniciar-ngrok.sh

# Probar todos los auto-logins
# Verificar persistencia de sesión
# Validar en diferentes navegadores
```

### 3. Documentar Cambios Importantes
```bash
# Antes de commit, actualizar documentación relevante
# En version-funcional branches: actualizar README
# En security-fixes: documentar en commit message
```

### 4. Mantener Branches Sincronizados
```bash
# Periódicamente, actualizar branches de desarrollo
git checkout security-fixes
git fetch origin
git merge origin/security-fixes

# Pero version-funcional-v2.0-koha-autologin NO se actualiza
# Es un snapshot estable
```

---

## 🎓 Glosario de Branches

**Branch principal (master):**
Branch de referencia original, sin modificaciones SSO.

**Branch de desarrollo (security-fixes):**
Branch activo donde se desarrollan nuevas features y mejoras.

**Branch de versión (version-funcional-v2.0-koha-autologin):**
Snapshot estable de una versión funcional específica. Se crea para:
- Tener punto de restauración
- Base para producción
- Referencia de implementación correcta
- No se modifica (salvo bugs críticos)

**Feature branch:**
Branch temporal para desarrollar una funcionalidad específica.
Se merge a development branch cuando está listo.

**Fix branch:**
Branch temporal para corregir un bug específico.
Se merge a branch afectado cuando está corregido.

---

## 📈 Historial de Versiones

### v1.0 (Commits anteriores)
- Auto-login implementado
- ⚠️ Sesión no persistía en Koha

### v2.0 (Commit 23253b3 + 367c848)
- ✅ Auto-login con persistencia
- ✅ URLs relativas
- ✅ Nginx sin reescribir cookies
- ✅ Documentación completa
- **Branch:** version-funcional-v2.0-koha-autologin

### v2.1 (Futuro)
- Mejoras de seguridad
- JWT tokens
- HTTPS
- **Branch:** version-funcional-v2.1 (por crear)

---

## 🔗 Referencias Rápidas

### Documentación Principal:
```bash
# En branch estable
git checkout version-funcional-v2.0-koha-autologin
cat VERSION_FUNCIONAL_KOHA_AUTOLOGIN.md
cat README_VERSION_FUNCIONAL_V2.md
```

### Verificar Branch Actual:
```bash
git branch
# El branch actual tiene un asterisco (*)
```

### Ver Último Commit:
```bash
git log -1 --oneline
```

### Verificar Diferencias con Otro Branch:
```bash
git diff version-funcional-v2.0-koha-autologin..security-fixes
```

---

## ✅ Checklist: Antes de Cambiar de Branch

Antes de `git checkout <otro-branch>`, verificar:

- [ ] Commits guardados (`git status` limpio)
- [ ] Docker containers detenidos si es necesario
- [ ] Documentación actualizada
- [ ] Testing completado (si aplicable)
- [ ] README actualizado (si es branch de versión)

---

## 🎯 Recomendación Final

**Para la mayoría de casos, usar:**
```bash
git checkout version-funcional-v2.0-koha-autologin
```

Este branch tiene:
- ✅ Todo funcionando
- ✅ Documentación completa
- ✅ Testing validado
- ✅ Estable para demos/producción
- ✅ README específico

**Solo usar `security-fixes` para:**
- Desarrollo activo de features
- Experimentación
- Mejoras incrementales

**Solo usar `master` para:**
- Referencia histórica
- Comparar cambios

---

**Versión del Documento:** 1.0
**Última Actualización:** 29 de Octubre 2025
**Autor:** Sistema SSO HENM
