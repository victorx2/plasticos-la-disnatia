# Handoff — próximo sprint (solo frontend)

Documento para abrir **Axones Acarigua/frontend** en otro Cursor y continuar sin contexto del chat anterior.

---

## Proyecto

|             |                                                          |
| ----------- | -------------------------------------------------------- |
| **Repo**    | `Axones Acarigua/frontend` (monorepo con `backend/`)     |
| **Stack**   | React 19, Vite, TypeScript, Tailwind                     |
| **Backend** | FastAPI en `../backend/` — contrato en `docs/API.md`     |
| **Dev**     | `npm run dev` → http://localhost:5174                    |

Leer primero: `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/MODULES.md`, `docs/GLOSARIO.md`, `docs/INFORME-PRODUCCION-ALBA.md`.

---

## Estado actual (MVP Alba cableado)

### Producción — flujo completo

| Paso | Menú / ruta | Notas |
| ---- | ----------- | ----- |
| Crear orden de producción | Datos maestros → Orden de producción → `/orden-produccion/nueva` | `sale_for`, RIF/dirección cliente |
| Programar | Programación `/programacion` | Etapas: Nueva · Pendiente · Mezcla · Extrusión · Completada |
| Mezclas del trabajo | Mezcla `/mezcla?work_order_id=` | Filtro por trabajo |
| **Producción mezcla (wizard)** | `/mezcla/produccion` | Empezar → culminar → **auto extrusión + entrada almacén** |
| Solicitar MP | `/solicitudes-material/nueva` | `Cargar desde mezclas`, panel kg |
| Almacén despacho | `/solicitudes-area/insumos/:id` | Salida MP: autorizar/despachar/rechazo |
| Almacén recepción | Misma ruta, `request_flow=inbound` | Botón **Recibir en almacén** |
| Revisión contraoferta | `/solicitudes-material/revision/:id` | Producción acepta/rechaza |
| Extrusión | `/extrusion`, `/extrusion/registro` | Resumen diario en hub |
| Despacho | `/despacho` | Paletas MVP |
| Reportes | `/reportes` | 3 pestañas MVP |

### Placeholders

- _(ninguno crítico; ver MODULES.md)_

### Permisos

`src/config/permissions.ts` — roles: `administrador`, `inventario`, `produccion`, `despacho`.

---

## Tareas roadmap Alba — estado

Ver tabla completa en **[INFORME-PRODUCCION-ALBA.md](./INFORME-PRODUCCION-ALBA.md)** §7.

| # | Tarea | Estado |
|---|--------|--------|
| P1 | Registro extrusión | **Hecho** |
| P2 | Mezcla ligada al trabajo en planta | **Hecho** |
| P3 | Orden de producción: cabecera + líneas | **Hecho** |
| P4 | Solicitudes: aceptar/rechazar/contra-lista + saldo kg | **Hecho** |
| P2b | Wizard mezcla + historial cruzado + cierre (extrusión/inbound) | **Hecho** |
| — | Despacho — [DESPACHO.md](./DESPACHO.md) | **Hecho (MVP)** |
| — | Reportes — [REPORTES.md](./REPORTES.md) | **Hecho (MVP)** |

### Cierre wizard P2b (implementado)

- `POST mixture-production-runs/{id}/complete` con `fully_used` crea:
  - `ExtrusionRun` (máquina `mezcla`, bobina automática)
  - `MaterialRequest` con `request_flow=inbound` + `AreaRequest` para almacén
- Historial: `GET mixture-production-runs/history?work_order_id=`
- UI: `MixtureProductionPage` + `MixtureProductionHistory` + toasts/enlaces post-culminación
- Almacén: `POST material-requests/{id}/receive` en `AreaRequestInsumosPage`

### Próximas mejoras (no bloquean operación piloto)

- Inventario tinta terminada al recibir inbound (asignar `material_id` en línea)
- `GET extrusion-runs/{id}` con vínculo a run de mezcla
- Migraciones DB formales (Alembic)

---

## Patrones de código (obligatorio)

```
features/<modulo>/
  types.ts
  api.ts
  labels.ts      # español
  hooks/
  pages/
```

- Listados: `PageShell`, `CatalogTable*`, `usePaginatedList`
- Forms: hook con validación + `sonner` toast
- Router: añadir a `IMPLEMENTED` en `router.tsx` + `IMPLEMENTED_URLS` en `menu.ts`
- Verificar: `npm run build`
- **No commitear** salvo que el usuario lo pida

---

## Referencias de código existentes

| Copiar patrón de | Para |
| ----------------- | ---- |
| `features/nroc-orders/` | Formulario con líneas dinámicas |
| `features/programacion/` | Tablero trabajos en planta |
| `features/tinta-mixtures/` | Mezcla + wizard producción |
| `features/material-requests/` + `area-requests/` | Ciclo solicitudes |
| `features/production/extrusion/` | Registro extrusión |
| `features/dispatch/`, `features/reports/` | Despacho y reportes MVP |

---

## API Python (`backend/`)

Contrato: `docs/API.md`. Variables en `frontend/.env.local`:

```env
VITE_DEV_API_URL=http://127.0.0.1:8000
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Backend local:

```bash
cd backend
.venv/Scripts/uvicorn app.main:app --reload --port 8000
```

Prueba E2E flujo Alba:

```bash
cd backend
.venv/Scripts/python scripts/e2e_flow_test.py
.venv/Scripts/python scripts/e2e_extrusion_test.py
```

Login dev: `admin` / `password`.

**Nota DB:** si el backend falla por columnas nuevas (`request_flow`, `extrusion_run_id`, etc.), borrar `backend/axones_acarigua.db` y reiniciar (se recrea con `create_all` + seed).

---

## Cómo usar en Cursor (otro equipo)

1. Abrir workspace: **`Axones Acarigua`** (raíz monorepo) o `frontend/`
2. Primera instrucción sugerida:

   > Lee `docs/INFORME-PRODUCCION-ALBA.md` §8 y `docs/HANDOFF-NEXT-SPRINT.md`. Ejecuta `e2e_flow_test.py` y corrige lo que falle.

3. Reglas en `.cursor/rules/` se cargan solas.

---

## Decisiones ya tomadas (no re-preguntar)

- **7 micrajes fijos** por bobina (M1–M7).
- **Objetivo kg** (ej. 950): mostrar solo si el API lo trae; total producido = suma kg del formulario.
- Etapas programación Acarigua: sin Montaje/Impresión/Laminación/Corte.
- **Orden de compra** = proveedor; **orden de producción** = pedido del cliente. Ver `docs/GLOSARIO.md`.
- Palectizado, stock sin pedido, módulo Administración — **fuera de alcance** MVP.
- Culminar mezcla en el mismo trabajo → **siempre** auto-extrusión + solicitud entrada almacén (salvo traslado total a otro trabajo).
