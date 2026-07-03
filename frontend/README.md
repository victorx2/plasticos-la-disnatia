# Axones Acarigua — Frontend

UI operativa de Axones Acarigua. **Proyecto solo frontend.**

## Stack

- React 19 + TypeScript + Vite 7
- React Router 7, Tailwind CSS, Radix UI
- Consume **API REST en Python** (servicio aparte, no en este repo)

## Desarrollo

```bash
npm install
npm run dev    # http://localhost:5174
npm run build
```

### Conectar el API Python

Crea `frontend/.env.local`:

```env
# URL del servidor Python en desarrollo (proxy Vite /api → aquí)
VITE_DEV_API_URL=http://127.0.0.1:8000

# Base URL del API (producción o sin proxy)
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

En dev, si no defines `VITE_API_BASE_URL`, Vite proxy redirige `/api` → `VITE_DEV_API_URL` (default `http://127.0.0.1:8000`).

## Documentación

| Archivo | Contenido |
|---------|-----------|
| [AGENTS.md](./AGENTS.md) | Contexto para Cursor |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Estructura y patrones |
| [docs/MODULES.md](./docs/MODULES.md) | Módulos implementados |
| [docs/API.md](./docs/API.md) | Contrato API Python esperado |
| [docs/ADDING-A-MODULE.md](./docs/ADDING-A-MODULE.md) | Nuevos módulos |
| [docs/HANDOFF-NEXT-SPRINT.md](./docs/HANDOFF-NEXT-SPRINT.md) | **Próximo sprint — extrusión, despacho, reportes** |
| [docs/EXTRUSION-REGISTER.md](./docs/EXTRUSION-REGISTER.md) | Spec registro de bobinas/micrajes |
| [docs/DESPACHO.md](./docs/DESPACHO.md) | Spec módulo despacho |
| [docs/REPORTES.md](./docs/REPORTES.md) | Spec reportes |

## Reglas Cursor

`.cursor/rules/*.mdc`

## Estado

Migración UI **completa** (MVP). Pendientes: **Alertas**, **Despacho**.

El API Python se implementa en **otro proyecto/repositorio**.
