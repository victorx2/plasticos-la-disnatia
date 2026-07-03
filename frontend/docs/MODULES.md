# Módulos — estado UI

Migración **frontend MVP completa**. Los datos vienen del **API Python externo** (ver [API.md](./API.md)).

## Implementados (pantallas)

| Módulo                  | Ruta(s)                       | Feature folder                  |
| ----------------------- | ----------------------------- | ------------------------------- |
| Resumen                 | `/resumen`                    | `features/dashboard`            |
| Alertas                 | `/alertas`                    | `features/alerts`               |
| Clientes                | `/clientes`, `/form`          | `features/masters/clients`      |
| Productos               | `/productos`, `/form`         | `features/masters/products`     |
| Proveedores             | `/proveedores`, `/form`       | `features/masters/suppliers`    |
| Vendedores              | `/vendedores`, `/form`        | `features/masters/vendors`      |
| Órdenes compra          | `/ordenes-compra`, `/nueva`   | `features/purchase-orders`      |
| Orden de producción     | `/orden-produccion`, `/nueva` | `features/nroc-orders`          |
| Materiales              | `/materiales`, `/form`        | `features/materials`            |
| Recepción               | `/recepciones`, `/nueva`      | `features/purchase-receipts`    |
| Movimientos             | `/movimientos-inventario`     | `features/inventory-movements`  |
| Solicitudes entre áreas | `/solicitudes-area`           | `features/area-requests`        |
| Solicitudes insumos     | `/solicitudes-material/nueva` | `features/material-requests`    |
| Devoluciones            | `/devoluciones`, `/nueva`     | `features/inventory-returns`    |
| Mezcla                  | `/mezcla`, `/nueva`           | `features/tinta-mixtures`       |
| Extrusión               | `/extrusion`                  | `features/production/extrusion` |
| Programación            | `/programacion`               | `features/programacion`         |

## Placeholders

- **Despacho** (`/despacho`)

## Documentado, pendiente de implementar

Ver [HANDOFF-NEXT-SPRINT.md](./HANDOFF-NEXT-SPRINT.md):

- Registro extrusión (`/extrusion/registro`)
- Despacho completo
- Reportes (`/reportes`)

## Fuera del alcance UI actual

Kanban drag, planilla completa de planta, PDFs, MES detallado — añadir aquí si se pide.

Terminología: ver [GLOSARIO.md](./GLOSARIO.md).

## Verificación

```bash
npm run build
```
