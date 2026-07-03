# Arquitectura — Frontend Acarigua

## Visión general

```
┌─────────────────────────────────────────────────────────┐
│  Browser (localhost:5174)                               │
│  React SPA — Axones Acarigua/frontend                   │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP JSON /api/*
                            ▼
┌─────────────────────────────────────────────────────────┐
│  API Python (externo, otro repo/servicio)               │
│  ej. FastAPI en :8000                                   │
└─────────────────────────────────────────────────────────┘
```

**Este repositorio = solo la caja de arriba.**

## Capas

### `src/app/`

Router, layout, `RequirePermission`.

### `src/config/`

`menu.ts`, `permissions.ts`.

### `src/features/<modulo>/`

`types.ts`, `api.ts`, `labels.ts`, `hooks/`, `pages/`.

### `src/shared/`

- `api/client.ts` — fetch al API Python
- `catalog/` — tablas, búsqueda, paginación
- `types/pagination.ts` — `PaginatedResponse<T>`

## Patrones UI

- Listados: `usePaginatedList` + `CatalogTablePanel` + `colSpan`
- Formularios: hooks + `PageShell` + `?id=` para edición
- Router: `IMPLEMENTED` + rutas explícitas antes de placeholders

## API

No hay código de servidor aquí. Contrato documentado en [API.md](./API.md).

Cuando el API Python exponga un endpoint, el trabajo en este repo es:

1. `features/<modulo>/api.ts`
2. `types.ts` si cambia la forma del JSON
3. Actualizar `docs/API.md`
