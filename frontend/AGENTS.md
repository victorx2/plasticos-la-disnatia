# AGENTS — Frontend Acarigua

## Qué es

Frontend operativo MVP de **Axones Acarigua**. **Solo UI** — sin backend en este repo.

- **API**: servicio **Python** externo (REST JSON). Implementación en otro proyecto.
- **Idioma UI**: español (`labels.ts` por feature).
- **Migración UI**: completa para alcance MVP.

## Principios

1. **Solo frontend** — no añadir Laravel, PHP ni backend aquí.
2. **Alcance mínimo** — no MES, kanban drag, PDFs, etc. salvo petición explícita.
3. **Un módulo = una feature** — `src/features/<nombre>/`
4. **Catálogo compartido** — `src/shared/catalog/`
5. **Contrato API** — documentar en `docs/API.md`; adaptar `api.ts` cuando Python esté listo.
6. **`npm run build`** al terminar cambios significativos.
7. **No commitear** salvo petición del usuario.

## Estructura

```
src/
  app/           # router, layout, permisos
  config/        # menu.ts, permissions.ts
  features/      # módulos (types, api, labels, hooks, pages)
  shared/        # api client, catalog, hooks, auth
```

## Nuevo módulo

[docs/ADDING-A-MODULE.md](./docs/ADDING-A-MODULE.md)

## Próximo sprint (handoff)

[docs/HANDOFF-NEXT-SPRINT.md](./docs/HANDOFF-NEXT-SPRINT.md) — extrusión registro, despacho, reportes.

## API Python

- Cliente: `src/shared/api/client.ts` (`getJson`, `postJson`, `patchJson`)
- Contrato esperado: [docs/API.md](./docs/API.md)
- Paginación: tipo `PaginatedResponse<T>` en `shared/types/pagination.ts`

## Comandos

```bash
npm run dev      # :5174
npm run build
```

Levantar el API Python por separado (ej. FastAPI en :8000).
