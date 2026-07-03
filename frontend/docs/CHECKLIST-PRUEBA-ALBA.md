# Checklist de prueba — Alba (piloto end-to-end)

Validación del flujo completo en **Axones Acarigua**: orden comercial → planta → mezcla → extrusión → sellado → almacén.

**Entorno:** frontend `http://localhost:5174` · backend `http://127.0.0.1:8001` · base `axones` (phpMyAdmin).

**Usuario sugerido:** rol **Producción** o **Administrador**.

Marcar cada ítem: ☐ pendiente · ☑ OK · ✗ falló (anotar qué pasó).

---

## Antes de empezar

| # | Verificación | ☐ |
|---|--------------|---|
| 0.1 | Backend encendido (la app carga datos, no toast de error al abrir listados) | |
| 0.2 | Existe al menos **1 cliente** en Datos maestros → Clientes | |
| 0.3 | Existe **1 producto** en Especificaciones de producto **con ese cliente asignado** (`client_id`); use **Medida / micraje / composición** (no CPE ni MPS) | |
| 0.4 | Hay **materiales** en Inventario → Materiales (seed o carga manual) | |

---

## Fase 1 — Orden de producción (AREA / comercial)

**Ruta:** `/orden-produccion` → **+ Nueva** → `/orden-produccion/nueva`

| # | Paso | Resultado esperado | ☐ |
|---|------|-------------------|---|
| 1.1 | Abrir **Nueva orden** | Formulario con secciones Datos, Notas, Ítems | |
| 1.2 | Elegir **Cliente** en el desplegable | Aparecen clientes registrados (no solo “Seleccione cliente…”) | |
| 1.3 | Completar **Venta para**, **Fecha** y al menos **1 línea** (producto + cantidad/kg) | Producto habilitado solo después de elegir cliente; medida/micraje en la especificación del producto | |
| 1.4 | **Guardar orden** | Redirige a **Programación**; toast o sin error | |
| 1.5 | Volver a `/orden-produccion` | La orden aparece en el listado (código tipo `OP-000x`) | |

**phpMyAdmin:** `client_orders` +1 fila · `client_order_lines` +1 fila.

---

## Fase 2 — Programación (trabajo en planta)

**Ruta:** `/programacion`

| # | Paso | Resultado esperado | ☐ |
|---|------|-------------------|---|
| 2.1 | Ver bloque **Líneas sin programar** | Aparece **una fila por ítem** de la orden (si la orden tiene 2 productos, deben verse 2 filas) | |
| 2.2 | Clic en **Programar** en la primera línea | Desaparece solo esa fila; mensaje de éxito | |
| 2.3 | Pestaña **Nueva** (o etapa inicial) en **Trabajos en planta** | Aparece un **trabajo en planta** (código tipo `TP-{orden}-{ítem}-0001`) | |
| 2.4 | Si la orden tenía **2 ítems**, programar la **segunda línea** | Segundo trabajo distinto (`…-2-0001`); cada uno con su producto | |
| 2.5 | Cambiar etapa a **Mezcla** (select) | Se guarda sin error | |
| 2.6 | Clic **Ver mezclas** | Abre `/mezcla?work_order_id=…` filtrado por ese trabajo | |

**phpMyAdmin:** `work_orders` +1 fila **por cada línea programada** (columna `client_order_line_id` distinta).

---

## Fase 3 — Mezcla (receta)

**Ruta:** `/mezcla` (con filtro de trabajo) → **+ Nueva mezcla** → `/mezcla/nueva`

| # | Paso | Resultado esperado | ☐ |
|---|------|-------------------|---|
| 3.1 | Selector **Trabajo en planta** | Muestra el trabajo programado | |
| 3.2 | Completar **SKU salida**, **Nombre del color**, **Subárea** | |
| 3.3 | Agregar **≥1 componente** (material base + cantidad kg) | Materiales de área tintas/químicos | |
| 3.4 | **Registrar mezcla** | Vuelve al listado de mezclas del trabajo; receta visible | |

**phpMyAdmin:** `tinta_mixtures` +1 · `tinta_mixture_components` +N.

---

## Fase 4 — Solicitud de materia prima (opcional pero recomendado)

**Ruta:** `/solicitudes-material/nueva?work_order_id=…`

**Nota:** el ciclo completo de autorizar / despachar requiere usuario con rol **Almacén**. En el formulario hay un panel de ayuda; en la bandeja de almacén (`/solicitudes-area/insumos/:id`) se explican los 3 pasos.

| # | Paso | Resultado esperado | ☐ |
|---|------|-------------------|---|
| 4.1 | Elegir el **trabajo en planta** correspondiente al producto | Si hay 2 ítems en la orden, hay 2 trabajos distintos — elija el correcto | |
| 4.2 | **Cargar desde mezclas** (si está el botón) | Líneas con kg según componentes de la receta de **ese** trabajo | |
| 4.3 | Enviar solicitud | Estado pendiente en listado de solicitudes | |

**Rol Almacén:** `/solicitudes-area/insumos/:id` → autorizar cupo kg → despachar (resta del cupo) → recibir entrada cuando aplique.

**phpMyAdmin:** `material_requests` +1 · `material_request_lines` +N.

---

## Fase 5 — Producción de mezcla → Extrusión

**Ruta:** `/mezcla/produccion?work_order_id=…`

| # | Paso | Resultado esperado | ☐ |
|---|------|-------------------|---|
| 5.1 | Seleccionar **trabajo** y **mezcla** registrada | Muestra **kg de mezcla a usar** (suma componentes) | |
| 5.2 | **Empezando producción** | Redirige a `/extrusion/registro?work_order_id=&mixture_run_id=` | |
| 5.3 | En runs activos, **Continuar extrusión** | Misma navegación con sesión existente | |
| 5.4 | Revisar **Historial** en mezcla/producción | Run visible al cerrar desde extrusión | |

**phpMyAdmin:** `mixture_production_runs` +1 `in_progress` → `completed` al enviar a despacho.

---

## Fase 6 — Extrusión → Despacho

**Ruta:** `/extrusion/registro` (desde fase 5) o `/extrusion` → Registrar

| # | Paso | Resultado esperado | ☐ |
|---|------|-------------------|---|
| 6.1 | Ver banner **kg iniciales / registrados / restantes** y temporizador | Timer auto si viene de mezcla | |
| 6.2 | Completar fila: **Máquina**, **Turno**, **Hora**, **Kg producidos**, **Cantidad bobinas** | Medida en lectura desde producto del trabajo | |
| 6.3 | **Registrar producción** | Tramo en acumulado; bobinas generadas para despacho | |
| 6.4 | **Enviar producción a despacho** | Cierra sesión, completa mezcla, abre `/despacho?work_order_id=` | |
| 6.5 | Si queda mezcla, modal: **Solicitar MP** o **Guardar sobrante** | | |
| 6.6 | En `/despacho`, bobinas del trabajo pre-filtradas | Checkbox y paleta OK | |
| 6.7 | (Opcional) Expandir **Micrajes avanzado** y registrar con detalle | No obligatorio para despacho | |

**phpMyAdmin:** `extrusion_runs` sesión `completed` · `extrusion_coils` sin `pallet_id` · `mixture_production_runs.status=completed`.

---

## Fase 7 — Sellado

**Ruta:** `/sellado` → **Nuevo registro** → `/sellado/registro`

| # | Paso | Resultado esperado | ☐ |
|---|------|-------------------|---|
| 7.1 | Elegir **trabajo en planta** | Muestra cliente / orden vinculada | |
| 7.2 | Agregar **≥1 bobina** con **unidades** | |
| 7.3 | **Guardar registro** | Vuelve a `/sellado`; fila en tabla de registros | |

**phpMyAdmin:** `sealing_runs` +1 · `sealing_bobina_lines` +N.

---

## Fase 8 — Cierre del ciclo

| # | Paso | Resultado esperado | ☐ |
|---|------|-------------------|---|
| 8.1 | En **Programación**, mover trabajo a **Completada** | |
| 8.2 | Orden de producción en `/orden-produccion` sigue coherente (estado / en planta) | |
| 8.3 | **Reportes** `/reportes` — revisar pestañas sin error de carga | |

---

## Resumen rápido en base de datos

Después de la prueba completa, en phpMyAdmin (`axones`) deberían tener **filas > 0** (si se ejecutó cada fase):

| Tabla | Fase |
|-------|------|
| `client_orders`, `client_order_lines` | 1 |
| `work_orders` | 2 |
| `tinta_mixtures`, `tinta_mixture_components` | 3 |
| `material_requests`, `material_request_lines` | 4 |
| `mixture_production_runs` | 5 |
| `extrusion_runs`, `extrusion_coils` | 5–6 |
| `sealing_runs`, `sealing_bobina_lines` | 7 |

---

## Problemas frecuentes

| Síntoma | Causa probable | Qué hacer |
|---------|----------------|-----------|
| Desplegable **Cliente** vacío | Error API o caché | Recargar F5; revisar Network → `clients?per_page=100` = 200 |
| Desplegable **Producto** vacío | Producto sin `client_id` del cliente elegido | Crear/editar especificación ligada al cliente |
| **Por programar** no muestra la orden | Ya tiene trabajo en planta para **todas** las líneas | Normal si ya se programó cada ítem; con 2 productos deben quedar 2 filas hasta programar ambos |
| Toast **Datos inválidos** en extrusión | Falta trabajo, turno, línea, kg en bobinas activas o temporizador | Completar cuadro de planta; micrajes solo si hay kg en bobina |
| Tablas de mezcla/extrusión en 0 | No se completó la fase | Seguir checklist desde fase 3 en adelante |

---

## Registro de la sesión de prueba

| Campo | Valor |
|-------|--------|
| Fecha | |
| Probado por | Alba |
| Orden creada (código) | |
| Trabajo en planta (código) | |
| Observaciones | |

---

*Documento generado para piloto operativo. Ver también [INFORME-PRODUCCION-ALBA.md](./INFORME-PRODUCCION-ALBA.md) y [HANDOFF-NEXT-SPRINT.md](./HANDOFF-NEXT-SPRINT.md).*
