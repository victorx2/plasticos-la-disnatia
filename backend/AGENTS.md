# AGENTS — Backend Acarigua

## Qué es

API REST **Python** para **Axones Acarigua**. Repo **separado** del frontend React.

- **Frontend**: `../frontend/` — solo consume JSON.
- **Base de datos**: MySQL / MariaDB (migraciones + seeders).
- **Estado actual**: estructura de carpetas vacía, sin lógica implementada.

## Principios

1. **Solo backend** — no añadir React, Vite ni componentes UI.
2. **Un módulo = una carpeta** — `modules/<nombre>/` espejo de `frontend/src/features/<nombre>/`.
3. **Contrato API** — rutas y JSON iguales a `frontend/docs/API.md`.
4. **Separación por archivo** — `types.py`, `api.py`, `hooks/`, `models/`; no archivos monolíticos.
5. **Migraciones y seeders** — cambios de BD solo vía `migrations/` y `seeders/`.
6. **No commitear** salvo petición del usuario.

## Estructura

```
app/           # main.py, router.py
config/        # menu.py, permissions.py
modules/       # negocio (espejo features frontend)
shared/        # database, auth, pagination
migrations/
seeders/
```

## Espejo frontend

Al implementar un módulo del frontend:

1. Leer `frontend/src/features/<modulo>/types.ts` y `api.ts`
2. Implementar en `modules/<modulo>/types.py`, `api.py`, `models/`
3. Actualizar `docs/API.md` si cambia el contrato

## Primer módulo sugerido

`modules/materials/` — Materiales (catálogo, áreas, stock).

## Comandos (futuro)

```bash
# uvicorn app.main:app --reload --port 8000
# alembic upgrade head
# python -m seeders.run
```
