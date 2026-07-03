# Reportes — especificación UI

Tres reportes solicitados en mock-up Excel. **No hay módulo en menú aún** — crear entrada nueva.

---

## Menú sugerido

Bajo **Inicio y monitoreo** o grupo propio:

```
Reportes  →  /reportes
```

Sub-vistas (tabs o rutas):

| Ruta                      | Reporte                             |
| ------------------------- | ----------------------------------- |
| `/reportes/tiempos`       | Tiempo entre etapas y tiempo muerto |
| `/reportes/consumo-total` | Total consumido (mezcla)            |
| `/reportes/consumo-orden` | Consumido por orden de producción |

Permiso sugerido: `reportes` → roles `administrador`, `produccion`.

---

## Reporte 1 — Tiempos

**Título:** Tiempo entre montaje, producción y tiempo muerto.

**Nota de dominio Acarigua:** En Programación las etapas activas son `Nueva`, `Pendiente`, `Mezcla`, `Extrusión`, `Completada` (ya no Montaje/Impresión/Laminación/Corte). Mapear en UI:

| Legacy / Excel | Etapa Acarigua UI                         |
| -------------- | ----------------------------------------- |
| Montaje        | Pendiente (o Nueva)                       |
| Producción     | Mezcla + Extrusión                        |
| Tiempo muerto  | Paradas / `dead_seconds` si API lo expone |

**UI:** Tabla por trabajo: código, cliente, tiempo efectivo, tiempo muerto, % utilización. Filtros: rango fechas, trabajo en planta.

**API futura:** `GET /api/reports/production-times?from=&to=`

---

## Reporte 2 — Total consumido

**Título:** Total de material consumido.

**Fuente:** registros de **Mezcla** (`features/tinta-mixtures`).

**UI:** Tabla por código/SKU mezcla, kg totales en período. Ejemplo Excel: `11pg1`, `3003`, `4000`, `10.000 kg`.

**API futura:** `GET /api/reports/mixture-consumption-total?from=&to=`

---

## Reporte 3 — Consumido por orden

**Título:** Consumo desglosado por orden de producción.

**Columnas ejemplo:** Cliente/producto (ej. Santoni), total producido (kg), totales mezcla por código.

**API futura:** `GET /api/reports/mixture-consumption-by-order?order_id=`

---

## MVP frontend

- `features/reports/` con una página shell y **3 tabs**.
- Filtros de fecha + estado vacío “Sin datos — conectar API Python”.
- Tipos en `types.ts` alineados a respuesta futura.
- No bloques enormes de mock salvo 2–3 filas de ejemplo comentadas en docs.

---

## Checklist

- [ ] Entrada menú + `permissions.ts`
- [ ] `ReportsHubPage.tsx` con tabs
- [ ] 3 sub-componentes o páginas
- [ ] `docs/API.md` — sección reportes
- [ ] `npm run build`
