# Registro de extrusión — especificación UI (nota Alba)

Pantalla operativa en `/extrusion/registro` conectada al flujo **Mezcla → Extrusión → Despacho**:

1. En **Producción mezcla**, **Empezando producción** llama `POST …/begin-extrusion` y navega a `/extrusion/registro?work_order_id=&mixture_run_id=`
2. Banner **kg iniciales / registrados / restantes** de mezcla + **temporizador** auto-iniciado
3. **Cuadro simple** (una fila): Máquina, Turno, Hora, Kg producidos, Medida, Cantidad bobinas
4. Abajo: desperdicio, core, bolsones; cambio de orden opcional
5. **Micrajes M1–M7** en acordeón **Avanzado** (colapsado; no obligatorio)
6. **Registrar producción** — guarda tramo (`POST segments` con `produced_kg` + `coils_count`)
7. **Enviar producción a despacho** — `POST close` con `complete_mixture` + navega a `/despacho?work_order_id=`
8. Si queda mezcla: modal con solicitar MP o guardar sobrante

API en `backend/modules/extrusion_runs/` y `mixture_production_runs/`.

---

## Ruta y código

| Item | Valor |
|------|--------|
| Ruta | `/extrusion/registro` |
| Query | `work_order_id`, `mixture_run_id` (desde mezcla) |
| Hub | `/extrusion` |
| Feature | `src/features/production/extrusion/` |
| Hook | `hooks/useExtrusionRegisterForm.ts` |
| E2E | `backend/scripts/e2e_flow_test.py` (begin-extrusion → segmento → close despacho) |

---

## Wireframe (cuadro simple)

```
┌──────────────────────────────────────────────────────────────────┐
│ Kg iniciales │ Kg registrados │ Kg restantes    Temporizador       │
├──────────────────────────────────────────────────────────────────┤
│ OP ▼   Operador                                                  │
│ Máquina │ Turno │ Hora │ Kg producidos │ Medida │ Cant. bobinas   │
├──────────────────────────────────────────────────────────────────┤
│ Desperdicio refil / transparente │ Core │ Bolsones               │
│ Formato ▼   Cambio orden ▼                                       │
├──────────────────────────────────────────────────────────────────┤
│ ▶ Micrajes M1–M7 (avanzado) — colapsado                          │
├──────────────────────────────────────────────────────────────────┤
│ ▶ Acumulado hoy (colapsable)                                     │
├──────────────────────────────────────────────────────────────────┤
│ [Registrar producción]  [Enviar producción a despacho]           │
└──────────────────────────────────────────────────────────────────┘
```

---

## API (sesión + tramos)

```http
POST /api/mixture-production-runs/{id}/begin-extrusion
GET  /api/extrusion-runs/active?work_order_id=
POST /api/extrusion-runs/sessions
POST /api/extrusion-runs/{session_id}/segments
POST /api/extrusion-runs/{session_id}/close
GET  /api/dispatch/bobinas-available
```

### Tramo cuadro simple (N bobinas para despacho)

```json
POST /api/extrusion-runs/{session_id}/segments
{
  "shift": "mañana",
  "operator_name": "María López",
  "effective_minutes": 120,
  "machine": "3",
  "produced_kg": "100",
  "coils_count": 2,
  "core_kg": "2.5",
  "waste_lines": [{ "waste_type": "refil", "waste_kg": "2.5" }]
}
```

Genera **N** registros `ExtrusionCoil` repartiendo kg (visibles en despacho sin `pallet_id`).

### Enviar a despacho

```json
POST /api/extrusion-runs/{session_id}/close
{
  "complete_mixture": true,
  "mark_work_completed": true,
  "last_segment": null
}
```

Respuesta incluye `mixture_remaining_kg` y `mixture_run_id`.

---

## Checklist — hecho

- [x] Flujo mezcla → begin-extrusion → registro con query params
- [x] Banner kg mezcla + temporizador auto
- [x] Cuadro fila única (máquina, turno, hora, kg, medida, bobinas)
- [x] Micrajes en Avanzado colapsado
- [x] Registrar producción + Enviar a despacho
- [x] Modal mezcla sobrante
- [x] Despacho pre-filtrado por `work_order_id`
- [x] E2E flujo completo

---

## Fuera de alcance

- PDF nota de despacho
- Sellado automático post-despacho
- Edición histórica en UI
