# Despacho — especificación UI

Módulo para **armar paletas** con bobinas producidas, registrar **kg por paleta** y generar **nota de despacho** + **hablador** (etiqueta).

**Solo frontend.** Hoy `/despacho` es **placeholder** (`ModulePlaceholderPage`).

---

## Ruta y código

| Item           | Valor                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Ruta           | `/despacho` (reemplazar placeholder)                                  |
| Feature folder | `src/features/dispatch/` (crear o limpiar carpeta huérfana si existe) |
| Permiso        | `despacho` — ya en `config/permissions.ts`                            |

---

## Flujo (mock-up Excel)

1. **Pool de bobinas** — bobinas registradas en extrusión, aún no asignadas a paleta.
2. **Armar paletas** — Paleta 1, Paleta 2, …
3. Por paleta: **total kg** (suma de bobinas asignadas o entrada manual según operación).
4. **Salida:** Nota de despacho + Hablador de paleta (MVP: vista previa HTML / imprimir; PDF fase 2).

---

## Wireframe sugerido (wizard)

### Paso 1 — Bobinas disponibles

Tabla con checkboxes: código bobina, trabajo en planta, cliente, kg, fecha.

### Paso 2 — Paletas

```
┌ Paleta 1 ────────────────┐  ┌ Paleta 2 ────────────────┐
│ Bobinas: 3               │  │ Bobinas: 2               │
│ Total: 300 kg            │  │ Total: 200 kg            │
│ [+ Asignar bobinas]      │  │ [+ Nueva paleta]         │
└──────────────────────────┘  └──────────────────────────┘
```

### Paso 3 — Confirmar

- Resumen cliente / destino (si aplica)
- Botones: **Generar nota de despacho** | **Imprimir hablador**

---

## MVP frontend (sin API)

- UI del wizard con datos **mock** en el hook.
- Totales calculados en cliente.
- Toast al “confirmar”; sin PDF real hasta API.

API futura (documentar en `docs/API.md`):

- `GET /api/dispatch/bobinas-available`
- `POST /api/dispatch/pallets`
- `POST /api/dispatch/notes` → devuelve id + URL PDF opcional

---

## Dependencias

- Requiere concepto de **bobina** desde registro de extrusión (`docs/EXTRUSION-REGISTER.md`).
- Rol: principalmente `despacho` + `administrador`.

---

## Checklist

- [ ] `features/dispatch/` (types, api, labels, hooks, pages)
- [ ] Reemplazar placeholder en `router.tsx`
- [ ] `npm run build`
