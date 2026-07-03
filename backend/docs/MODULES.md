# Módulos — organizados por menú de la app

Espejo del menú lateral de Axones Acarigua y de `frontend/src/config/menu.ts`.

## Inicio y monitoreo

| Menú    | Ruta UI    | Módulo backend       |
| ------- | ---------- | -------------------- |
| Resumen | `/resumen` | `modules/dashboard/` |
| Alertas | `/alertas` | `modules/alerts/` — alertas operativas automáticas |

## Datos maestros

| Menú                         | Ruta UI           | Módulo backend               |
| ---------------------------- | ----------------- | ---------------------------- |
| Vendedores                   | `/vendedores`     | `modules/masters/vendors/`   |
| Clientes                     | `/clientes`       | `modules/masters/clients/`   |
| Especificaciones de producto | `/productos`      | `modules/masters/products/`  |
| Proveedores                  | `/proveedores`    | `modules/masters/suppliers/` |
| Órdenes de compra            | `/ordenes-compra` | `modules/purchase-orders/`   |

## Inventario

| Menú                    | Ruta UI                   | Módulo backend                 |
| ----------------------- | ------------------------- | ------------------------------ |
| Materiales              | `/materiales`             | `modules/materials/`           |
| Solicitudes entre áreas | `/solicitudes-area`       | `modules/area-requests/`       |
| Recepción               | `/recepciones`            | `modules/purchase-receipts/`   |
| Movimientos             | `/movimientos-inventario` | `modules/inventory-movements/` |
| Devoluciones            | `/devoluciones`           | `modules/inventory-returns/`   |

### Materiales — pantalla activa (referencia UI)

- Pestañas de área: Todos, Sustrato, Tintas, Químicos, Misceláneos
- Búsqueda: SKU, nombre, código de barras
- Columnas: N.º, SKU, Nombre, Área, Micras, Ancho (mm), Unidad, Stock, Proveedor
- Archivos backend: `modules/materials/types.py`, `api.py`, `areas.py`, `hooks/`, `models/`

## Producción

| Menú                   | Ruta UI             | Módulo backend                  |
| ---------------------- | ------------------- | ------------------------------- |
| Orden de producción | `/orden-produccion` | `modules/client-orders/`        |
| Programación | `/programacion`     | `modules/programacion/`         |
| Mezcla                 | `/mezcla`           | `modules/tinta-mixtures/`       |
| Extrusión              | `/extrusion`        | `modules/production/extrusion/` |

## Otros

| Menú                   | Ruta UI                 | Módulo backend               |
| ---------------------- | ----------------------- | ---------------------------- |
| Solicitudes de insumos | `/solicitudes-material` | `modules/material-requests/` |
| Despacho               | `/despacho`             | `modules/dispatch/`          |

## Transversal

| Función             | Módulo backend     |
| ------------------- | ------------------ |
| Login / JWT / roles | `modules/auth/`    |
| Cuenta de usuario   | `modules/account/` |

## Carpetas legacy / futuras (espejo frontend vacío)

Existen en `modules/` por carpetas placeholder en el frontend; implementar cuando el UI las active:

- `modules/extrusion/` — extrusión legacy
- `modules/inventory/` — inventario genérico
- `modules/mixing/` — mezcla legacy
- `modules/scheduling/` — programación legacy

**Usar preferentemente** los módulos activos del menú (`tinta-mixtures`, `programacion`, `production/extrusion`, `materials`).
