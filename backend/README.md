# Axones Acarigua — Backend (API Python)

API REST para Axones Acarigua. **Proyecto separado del frontend.**

| | |
|--|--|
| **Frontend** | `../frontend/` (React) |
| **Contrato API** | `docs/API.md` (espejo de `frontend/docs/API.md`) |
| **Base de datos** | MySQL / MariaDB (phpMyAdmin para administración) |
| **Estado** | MVP con auth JWT, datos maestros, compras/recepciones |

## Producción

| Método | Guía |
|--------|------|
| **Docker (recomendado PC empresa)** | [`../docs/DEPLOY-DOCKER.md`](../docs/DEPLOY-DOCKER.md) |
| Linux + Nginx manual | [`docs/DEPLOY.md`](docs/DEPLOY.md) |

Resumen:

1. Copiar `.env.example` → `.env` con `ENVIRONMENT=production`, `JWT_SECRET` (≥32 chars), `DATABASE_URL` MySQL, `CORS_ORIGINS`.
2. `python scripts/run_migrations.py` (Alembic upgrade head).
3. `uvicorn app.main:app --host 127.0.0.1 --port 8000` detrás de Nginx + HTTPS.
4. Frontend: `VITE_API_BASE_URL=https://tu-dominio.com/api` y `npm run build`.
5. Verificación: `python scripts/smoke_purchase_flow.py`.

Usuarios iniciales (cambiar contraseñas tras despliegue): `admin` / `password`, `inventario` / `inventario`.

## Arranque rápido (desarrollo)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Por defecto usa SQLite (`axones_acarigua.db` en `backend/`). Para MySQL, copie `.env.example` a `.env` y configure `DATABASE_URL`.

Health: `GET http://127.0.0.1:8000/up`

## Endpoints implementados

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login JWT (usuarios en tabla `users`) |
| GET | `/api/auth/me` | Usuario autenticado (requiere Bearer) |
| GET | `/api/materials` | Listado paginado (`q`, `page`, `per_page`, `inventory_area`) |
| POST | `/api/materials` | Crear material |
| PATCH | `/api/materials/{id}` | Actualizar material |
| POST | `/api/materials/import` | Importar CSV multipart (`file`) |

## Principio

- **Un módulo = una carpeta** en `modules/`, espejo de `frontend/src/features/`.
- **Sin mezclar** UI ni código React aquí.
- **Sin PHP/Laravel** en este repo.

## Estructura raíz

```
backend/
  app/              # Punto de entrada FastAPI, registro de rutas
  config/           # Menú API, permisos por rol (espejo frontend/config)
  modules/          # Módulos de negocio (espejo frontend/src/features)
  shared/           # DB, auth JWT, paginación, excepciones
  migrations/       # Alembic — crear/alterar tablas MySQL
  seeders/          # Datos iniciales (como Laravel db:seed)
  tests/
  docs/
```

## Mapa menú → módulo

Ver [docs/MODULES.md](./docs/MODULES.md) y [docs/STRUCTURE.md](./docs/STRUCTURE.md).

## Convención de archivos (espejo frontend)

| Frontend (`features/`) | Backend (`modules/`) | Rol |
|------------------------|----------------------|-----|
| `types.ts` | `types.py` | Esquemas / DTOs |
| `api.ts` | `api.py` | Rutas REST |
| `labels.ts` | `labels.py` | Constantes / mensajes |
| `areas.ts`, `enums.ts`, … | mismo nombre `.py` | Dominio del módulo |
| `hooks/*.ts` | `hooks/*.py` | Lógica de caso de uso |
| `pages/*.tsx` | `pages/*.py` | Endpoints por pantalla |
| `components/*.tsx` | `components/*.py` | Sub-recursos / líneas |
| — | `models/` | Tablas SQLAlchemy (solo backend) |

## Próximos pasos (cuando se implemente)

1. FastAPI + SQLAlchemy + Alembic + MySQL
2. Implementar `modules/materials/` primero (catálogo de insumos)
3. Auth JWT en `modules/auth/`
4. Resto de módulos según `docs/MODULES.md`

## Documentación

| Archivo | Contenido |
|---------|-----------|
| [AGENTS.md](./AGENTS.md) | Contexto para Cursor |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Capas y flujo |
| [docs/STRUCTURE.md](./docs/STRUCTURE.md) | Árbol completo de carpetas |
| [docs/MODULES.md](./docs/MODULES.md) | Módulos por menú de la app |
| [docs/API.md](./docs/API.md) | Contrato REST con el frontend |
