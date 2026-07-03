# Estructura de carpetas — Backend

Árbol espejo de `frontend/src/features/` + infraestructura API.

## Raíz

```
backend/
├── AGENTS.md
├── README.md
├── .env.example
├── .gitignore
├── app/
│   ├── __init__.py
│   ├── main.py
│   └── router.py
├── config/
│   ├── __init__.py
│   ├── menu.py
│   └── permissions.py
├── shared/
│   ├── api/
│   ├── auth/
│   ├── database/
│   ├── exceptions/
│   ├── pagination/
│   ├── types/
│   └── utils/
├── migrations/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── seeders/
│   ├── run.py
│   ├── auth.py
│   ├── dashboard.py
│   ├── materials.py
│   └── … (uno por grupo de menú)
├── tests/
│   ├── conftest.py
│   └── modules/
└── modules/
```

## modules/ — por menú

### Inicio y monitoreo

```
modules/dashboard/
  types.py, api.py, labels.py, map_summary.py
  hooks/dashboard_summary.py
  pages/summary_page.py
  components/summary_header.py, kpi_card.py
  models/

modules/alerts/
  types.py, api.py, labels.py
  pages/alerts_page.py
  models/
```

### Datos maestros

```
modules/masters/
  clients/     types.py, api.py, labels.py, hooks/, pages/, models/
  products/    …
  suppliers/   …
  vendors/     …
  shared/      rif.py, hooks/, components/

modules/purchase-orders/
  types.py, api.py, labels.py, status.py, code.py
  hooks/, pages/, components/, models/
```

### Inventario

```
modules/materials/                    ← Materiales (pantalla principal)
  types.py          ← frontend/types.ts
  api.py            ← frontend/api.ts
  labels.py         ← frontend/labels.ts
  areas.py          ← frontend/areas.ts
  hooks/
    materials_list.py
    material_form.py
    material_options.py
  pages/
    materials_list_page.py
    material_form_page.py
  models/           ← tablas MySQL (solo backend)

modules/area-requests/
modules/purchase-receipts/
modules/inventory-movements/
modules/inventory-returns/
```

### Producción

```
modules/client-orders/
modules/programacion/
modules/tinta-mixtures/
modules/production/extrusion/
```

### Otros

```
modules/material-requests/
modules/dispatch/
modules/auth/
modules/account/
```

## Convención de nombres

| Frontend | Backend |
|----------|---------|
| `useMaterialsList.ts` | `hooks/materials_list.py` |
| `MaterialsListPage.tsx` | `pages/materials_list_page.py` |
| `board-stages.ts` | `board_stages.py` |
| `item-type.ts` | `item_type.py` |

## Archivos vacíos

Todos los `.py` están vacíos (placeholder). La implementación va módulo por módulo sin mezclar responsabilidades.
