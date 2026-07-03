# Arquitectura — Backend Acarigua

## Visión general

```
┌─────────────────────────────────────────────────────────┐
│  Frontend React (../frontend/)                          │
│  localhost:5174 / producción                            │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS JSON /api/*
                            ▼
┌─────────────────────────────────────────────────────────┐
│  API Python (este repo)                                 │
│  FastAPI — ej. :8000                                    │
│  modules/ + shared/                                     │
└───────────────────────────┬─────────────────────────────┘
                            │ SQL
                            ▼
┌─────────────────────────────────────────────────────────┐
│  MySQL / MariaDB                                        │
│  Administración: phpMyAdmin                             │
└─────────────────────────────────────────────────────────┘
```

**Este repositorio = solo la caja del medio (API + BD).**

## Capas

### `app/`

- `main.py` — creación de la app FastAPI
- `router.py` — montaje de routers de `modules/*/api.py`

### `config/`

- `menu.py` — agrupación de rutas (espejo `frontend/src/config/menu.ts`)
- `permissions.py` — roles: administrador, inventario, produccion, despacho

### `modules/<modulo>/`

| Carpeta / archivo | Responsabilidad |
|-------------------|-----------------|
| `types.py` | Pydantic schemas (request/response) |
| `api.py` | Router FastAPI del módulo |
| `labels.py` | Constantes de dominio |
| `hooks/` | Servicios / casos de uso |
| `pages/` | Handlers agrupados por pantalla del frontend |
| `components/` | Sub-recursos (líneas de OC, recepción, etc.) |
| `models/` | Modelos SQLAlchemy (tablas MySQL) |

### `shared/`

| Carpeta | Responsabilidad |
|---------|-----------------|
| `database/` | Conexión, session, Base declarativa |
| `auth/` | JWT, dependencias `get_current_user` |
| `pagination/` | `PaginatedResponse` (espejo frontend) |
| `exceptions/` | Handlers HTTP 4xx/5xx con `message` |

### `migrations/`

Alembic — equivalente a `php artisan migrate`.

### `seeders/`

Scripts por módulo — equivalente a `php artisan db:seed`.

## Flujo por request

1. `api.py` recibe HTTP
2. `hooks/` valida y ejecuta lógica
3. `models/` lee/escribe MySQL
4. `types.py` serializa JSON para el frontend

## Contrato con el frontend

- Prefijo: `/api/`
- Auth: `Authorization: Bearer <token>`
- Paginación: ver `shared/types/pagination.py` y `frontend/src/shared/types/pagination.ts`
- Detalle de rutas: [API.md](./API.md)
