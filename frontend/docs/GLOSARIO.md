# Glosario — terminología en pantalla (Acarigua)

Reglas acordadas con dirección de producto (Valeria, junio 2026). **No usar siglas NROC/NROP en la UI.**

## Términos en el sistema

| En pantalla | Qué es | Código interno / API |
|-------------|--------|----------------------|
| **Orden de producción** | Lo que el **cliente** pide fabricar (Área Encargada; menú **Datos maestros**) | `client-orders`, carpeta `nroc-orders/` |
| **Nº OP (lote)** | Número comercial que puede agrupar **varios pedidos cliente** (distintos clientes o líneas) | `production-batches`, campo `batch_code` en `client-orders` |
| **Órdenes de compra** | Compra de **material** a proveedor (resina, etc.) | `purchase-orders` |
| **Programación / trabajos en planta** | Seguimiento operativo por producto/mezcla (kg, etapas) | `work-orders`, carpeta `programacion/` |
| **Mezcla** | Suma de **resina** y materias primas (kg) por trabajo en planta — no es laboratorio de tintas (Axones) | `tinta-mixtures`, menú Producción → Mezcla |

## Mezcla vs Axones (tintas)

En **Acarigua** la mezcla es **resina + materias primas en kg** para extrusión. No se “crean tintas” ni se usan subáreas de laminación/superficie como en Axones. En pantalla debe decir **Resina** / **Mezcla**, nunca **Tintas**.

## Reglas

1. **Orden de compra** en el menú = solo proveedor. No es el pedido del cliente.
2. **Orden de producción** = pedido del cliente (una pantalla, un concepto para el usuario). En el menú lateral está bajo **Datos maestros** (después de Órdenes de compra); la ruta sigue siendo `/orden-produccion`.
3. **Nº OP** = código del lote (`production_batches.code`). Varios pedidos cliente pueden compartir el mismo Nº OP; cada pedido conserva su código propio (`client_orders.code`).
4. Un pedido puede tener **varios trabajos en planta** (`work-orders`) sin mostrar otro menú “orden de producción”.
5. **No** módulo ni flujo de “Administración” en el MVP.
6. Palectizado, stock sin pedido, etc. — **fuera de alcance** hasta nueva definición.

## Rutas

| Ruta | Módulo usuario | Menú lateral |
|------|----------------|--------------|
| `/orden-produccion` | Orden de producción | Datos maestros |
| `/programacion` | Programación | Producción |
| `/ordenes-compra` | Órdenes de compra (proveedor) | Datos maestros |

Ver también: [HANDOFF-NEXT-SPRINT.md](./HANDOFF-NEXT-SPRINT.md), [INFORME-PRODUCCION-ALBA.md](./INFORME-PRODUCCION-ALBA.md), [API.md](./API.md).
