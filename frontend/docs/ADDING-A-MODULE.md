# Cómo agregar un módulo (solo frontend)

## 1. Feature

```
src/features/<modulo>/
  types.ts, api.ts, labels.ts
  hooks/, pages/
```

Copiar patrón: `nroc-orders`, `purchase-orders`, `programacion`.

## 2. api.ts

Llamadas al API Python vía `shared/api/client.ts`. Documentar ruta nueva en `docs/API.md`.

## 3. Registrar en la app

- `src/app/router.tsx` → `IMPLEMENTED` + ruta
- `src/config/menu.ts` → `IMPLEMENTED_URLS`, `menuTitleForPath`
- `src/config/permissions.ts` si es entrada nueva de menú

## 4. UI

- `PageShell`, textos en `labels.ts`
- Listados: `colSpan`, `CatalogEmptyState` con `icon`

## 5. API Python (otro proyecto)

Implementar endpoint que coincida con `api.ts` y `types.ts`. Este repo no incluye servidor.

## 6. Verificar

```bash
npm run build
```

## Anti-patrones

- No añadir backend (Laravel, PHP, FastAPI) en este repo
- No referenciar repos legacy como dependencia de desarrollo
- No agregar dependencias npm sin necesidad
