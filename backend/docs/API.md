# Contrato API — Backend Python

Documento espejo del contrato que consume el frontend.

**Fuente de verdad compartida:** `../frontend/docs/API.md`

Al implementar endpoints aquí, mantener sincronizados:

- `backend/docs/API.md` (este archivo)
- `frontend/docs/API.md`
- `frontend/src/features/<modulo>/api.ts`
- `frontend/src/features/<modulo>/types.ts`

## Base URL

```
http://127.0.0.1:8000/api
```

## Auth

| Método | Ruta          |
| ------ | ------------- |
| POST   | `/auth/login` |

## Endpoints por módulo

| Módulo backend         | Rutas                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `dashboard`            | `GET dashboard/summary`                                                            |
| `alerts`               | `GET operational-alerts`, `GET operational-alerts/unread-count`, `POST operational-alerts/sync`, `POST operational-alerts/{id}/read`, `POST operational-alerts/read-all` |
| `masters/clients`      | `GET/POST/PATCH clients`, `GET clients/{id}`                                       |
| `masters/products`     | `GET/POST/PATCH products`                                                          |
| `masters/suppliers`    | `GET/POST/PATCH suppliers`                                                         |
| `masters/vendors`      | `GET/POST/PATCH vendors`                                                           |
| `purchase-orders`      | `GET/POST/PATCH purchase-orders`                                                   |
| `materials`            | `GET/POST/PATCH materials`                                                         |
| `purchase-receipts`    | `GET/POST purchase-receipts`                                                       |
| `inventory-movements`  | `GET inventory-movements`                                                          |
| `area-requests`        | `GET area-requests`                                                                |
| `material-requests`    | `POST material-requests`                                                           |
| `inventory-returns`    | `GET/POST inventory-returns`, `POST inventory-returns/{id}/accept`                 |
| `tinta-mixtures`       | `GET/POST tinta-mixtures`                                                          |
| `programacion` | `GET work-orders/programacion-board`, `PATCH work-orders/{id}`, `POST work-orders` |
| `client-orders` | `GET/POST/PATCH client-orders`, `GET client-orders/{id}` |

Terminología en pantalla: ver `../frontend/docs/GLOSARIO.md`. Endpoints sin renombrar: orden de producción = `client-orders`, trabajo en planta = `work-orders`.

Ver payloads en los `types.ts` del frontend.
