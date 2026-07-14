# Axones Acarigua

Monorepo con **frontend** y **backend separados** (sin mezclar código).

| Carpeta | Qué es |
|---------|--------|
| [`frontend/`](./frontend/) | UI React — consume la API |
| [`backend/`](./backend/) | API Python — estructura lista, MySQL + migraciones |

- Sin Laravel, sin PHP
- Base de datos: MySQL / MariaDB (phpMyAdmin para administración)

## Inicio rápido

```bash
cd frontend
npm install
npm run dev    # http://localhost:5174
```

Configura la URL del API Python en `frontend/.env.local`:

```env
VITE_DEV_API_URL=http://127.0.0.1:8000
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Demo gratis (Render)

Front + back en una URL pública (plan free): [docs/GUIA-DEMO-RENDER.md](./docs/GUIA-DEMO-RENDER.md)

## Documentación

| Archivo | Contenido |
|---------|-----------|
| [frontend/README.md](./frontend/README.md) | Guía del frontend |
| [backend/README.md](./backend/README.md) | Guía del backend (API Python) |
| [frontend/AGENTS.md](./frontend/AGENTS.md) | Contexto Cursor — frontend |
| [backend/AGENTS.md](./backend/AGENTS.md) | Contexto Cursor — backend |
| [backend/docs/MODULES.md](./backend/docs/MODULES.md) | Módulos por menú de la app |
| [frontend/docs/API.md](./frontend/docs/API.md) | Contrato REST (compartido) |
| [docs/GUIA-DEMO-RENDER.md](./docs/GUIA-DEMO-RENDER.md) | Subir demo gratis a Render |

## Cursor

- **Frontend:** abre `frontend/` o la raíz del monorepo
- **Backend:** reglas en `backend/.cursor/rules/`
- **Frontend:** reglas en `frontend/.cursor/rules/`
