# Contrato API — Python (externo)

Este repo **no contiene el backend**. El frontend espera un **API REST JSON** en Python (FastAPI, Django REST, etc.) en otro servicio.

## Configuración en el frontend

`frontend/.env.local`:

```env
VITE_DEV_API_URL=http://127.0.0.1:8000
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Cliente HTTP: `src/shared/api/client.ts`

- Paths relativos al base: `"client-orders"`, `"products/123"`
- Auth: header `Authorization: Bearer <token>`
- Content-Type: `application/json`

## Auth

| Método | Ruta              | Uso                         |
| ------ | ----------------- | --------------------------- |
| POST   | `/api/auth/login` | Login (ver `features/auth`) |
| —      | Bearer token      | Resto de rutas              |

Respuesta login: token + usuario con campo `role` (permisos en `config/permissions.ts`).

## Paginación (listados)

El frontend usa `PaginatedResponse<T>`:

```json
{
  "data": [],
  "current_page": 1,
  "last_page": 1,
  "per_page": 20,
  "total": 0,
  "from": null,
  "to": null
}
```

Query común: `q`, `page`, `per_page`, más filtros por módulo.

## Errores de validación (422)

Validación de negocio en datos maestros y compras:

```json
{
  "message": "Datos inválidos",
  "errors": {
    "email": ["Correo inválido."],
    "rif": ["Si no marca «Sin RIF», debe completar el RIF."]
  }
}
```

Campos habituales: `rif`, `email`, `phone`, `vendor_id`, `client_id`, `photo`.

## Datos maestros — detalle

### Listados activo/inactivo

`GET clients`, `GET vendors`, `GET suppliers` aceptan query `active=0|1`.

`PATCH` del recurso acepta `{ "active": true|false }`.

Respuesta incluye `photo_url` (string o null) en clientes, vendedores y proveedores.

### Clientes — `no_rif`

En `POST/PATCH clients`, campo opcional `no_rif: true` fuerza `rif: null` (equivalente a «Sin RIF» en UI).

### Fotos de entidad (clientes, vendedores, proveedores)

| Método | Ruta | Body |
|--------|------|------|
| POST | `/api/clients/{id}/photo` | `multipart/form-data`, campo `file` |
| DELETE | `/api/clients/{id}/photo` | — |
| POST | `/api/vendors/{id}/photo` | igual |
| DELETE | `/api/vendors/{id}/photo` | — |
| POST | `/api/suppliers/{id}/photo` | igual |
| DELETE | `/api/suppliers/{id}/photo` | — |

Reglas: JPG, PNG o WebP; máximo 2 MB. URL guardada en `photo_url` (p. ej. `/uploads/avatars/clients/1.jpg`). Servidas bajo `/uploads/…`.

Errores de foto usan clave `photo` en `errors`.

## Terminología (pantalla)

Ver [GLOSARIO.md](./GLOSARIO.md). Resumen:

| En pantalla | Tipo TS (frontend) | Endpoint API |
|-------------|--------------------|--------------|
| Orden de producción | `NrocOrder` | `client-orders` |
| Trabajo en planta (programación) | `ProductionOrderRow` | `work-orders` |
| Orden de compra (proveedor) | `PurchaseOrder` | `purchase-orders` |

Los campos JSON del API (`client_order_id`, `work_order_id`, `awaiting_ot`) **no se renombran** en el wire; el frontend mapea en `api.ts` cuando hace falta.

## Endpoints consumidos por módulo

Referencia para implementar el API Python. Rutas bajo prefijo `/api/`.

| Módulo                 | Métodos / rutas                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Dashboard              | `GET dashboard/summary`                                                            |
| Alertas operativas     | `GET operational-alerts`, `GET operational-alerts/unread-count`, `POST operational-alerts/sync`, `POST operational-alerts/{id}/read`, `POST operational-alerts/read-all` |
| Clientes               | `GET/POST/PATCH clients`, `GET clients/{id}`; `?active=`; `no_rif`; foto `POST/DELETE clients/{id}/photo` |
| Productos              | `GET/POST/PATCH products` — `client_id` debe existir y estar activo |
| Proveedores            | `GET/POST/PATCH suppliers`; `?active=`; `no_rif`; foto `POST/DELETE suppliers/{id}/photo` |
| Vendedores             | `GET/POST/PATCH vendors`; `?active=`; foto `POST/DELETE vendors/{id}/photo` |
| Órdenes compra         | `GET/POST/PATCH purchase-orders`                                                   |
| Materiales             | `GET/POST/PATCH materials`                                                         |
| Recepciones            | `GET/POST purchase-receipts`                                                       |
| Movimientos            | `GET inventory-movements`                                                          |
| Solicitudes área       | `GET area-requests`, acciones en `material-requests`                               |
| Solicitudes insumos    | `POST material-requests` (`work_order_id`, líneas, opcional `allow_replenishment: true` si cupo principal agotado); `GET material-requests/{id}`; … |
| Devoluciones           | `GET/POST inventory-returns` (`extrusion_run_id`, `destination_area: bobinas_rechazadas`), `POST …/{id}/accept` |
| Mezcla                 | `GET/POST tinta-mixtures` (query `work_order_id`)                                  |
| Programación | `GET work-orders/programacion-board`, `PATCH work-orders/{id}`, `POST work-orders` |
| Orden de producción | `GET/POST/PATCH client-orders` — campos `sale_for`, `batch_id`, `batch_code` (lectura), líneas con `quantity`, `unit`, `description`, `notes`. Query `batch_id` en listado. |
| Nº OP (lote) | `POST production-batches` (crear Nº OP + primer pedido), `GET production-batches/{id}`, `POST production-batches/{id}/orders` (agregar pedido al mismo lote) |
| Registro extrusión | `GET extrusion-runs/active?work_order_id=`, `POST extrusion-runs/sessions`, `POST extrusion-runs/{id}/segments` — tramos con `machine` (`"1"`…`"7"`), `core_kg`, `coils`, `waste_lines`, `bolsones_kg`; `POST extrusion-runs/{id}/close`; `GET extrusion-runs/daily-summary` — por turno/línea: `total_kg`, `total_core_kg`, `total_waste_kg`, `coils_count`, `runs_count`. Legacy: `POST extrusion-runs`, `POST …/start`, `POST …/{id}/complete`, `PATCH …/{id}/reassign` |
| Producción mezcla | `GET/POST mixture-production-runs`, `POST …/{id}/complete`, `GET …/history?work_order_id=` |
| Despacho | `GET dispatch/bobinas-available`, `POST dispatch/pallets` |
| Reportes | `GET reports/production-times` — `effective_minutes` (suma de tramos), `segment_count`, `effective_hours` (legacy). `…/mixture-consumption-total`, `…/mixture-consumption-by-order` — en **Por orden**: `total_produced_kg` (film extruido), `total_mixture_used_kg` (mezcla consumida en extrusión), `mixture_received_cross_kg` / `mixture_sent_cross_kg` (cruces), `mixture_totals` = kg **utilizados** por submezcla (no cupo despachado). |

Implementación Python en `backend/` del monorepo (FastAPI + SQLAlchemy).
- Mantener mismas rutas y formas de respuesta que consumen los `api.ts` del frontend.
- Al cambiar el contrato, actualizar `types.ts` + `api.ts` aquí y esta documentación.
